import { DurableObject } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import type {
	ConnectionClass,
	RoomClientMessage,
	RoomServerMessage,
	RoomSnapshot,
	SubmissionStatus,
	SubmissionView,
	TickerMessageView
} from '../components/shows/room-protocol';
import { LOWER_THIRD_DISPLAY_MS } from '../components/shows/room-protocol';
import { better_auth_user } from './db/auth-schema';
import { showHosts } from './db/registry-schema';
import { verifySessionToken } from './verify-jwt';

interface ConnectionContext {
	class: ConnectionClass;
	userId: string | null;
}

/**
 * One Durable Object per show. Source of truth for that show's live room state — ticker,
 * lower-third, submissions, votes, featured selection, the submissions-open gate — persisted
 * to its own SQLite (survives hibernation) and fanned out to WebSocket clients via the
 * Hibernation API. Verifies the Better Auth JWT on connect and classifies the socket
 * (anonymous / viewer / admin), stashing that via serializeAttachment() so wakes don't
 * re-verify. Permissions are enforced in the message handler; each consumer receives a
 * snapshot pre-shaped to what it may read.
 *
 * Registry-origin facts (assigned hosts + their display names, the ban list) are hydrated
 * from D1 once at room activation and kept current by write-through RPC; the hot
 * vote/submit/broadcast path reads only this DO's SQLite, never D1.
 *
 * See docs/adr/0002 — Hibernation API, no in-DO setInterval/setTimeout; the lower-third
 * auto-hide is a single Alarm.
 */
export class ShowRoom extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		const sql = ctx.storage.sql;
		sql.exec(
			'CREATE TABLE IF NOT EXISTS ticker (id TEXT PRIMARY KEY, text TEXT NOT NULL, createdAt INTEGER NOT NULL)'
		);
		sql.exec(
			'CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, authorId TEXT NOT NULL, kind TEXT NOT NULL, url TEXT NOT NULL, title TEXT, notes TEXT, status TEXT NOT NULL, isFeatured INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL)'
		);
		sql.exec(
			'CREATE TABLE IF NOT EXISTS votes (submissionId TEXT NOT NULL, voterId TEXT NOT NULL, PRIMARY KEY (submissionId, voterId))'
		);
		sql.exec(
			'CREATE TABLE IF NOT EXISTS hosts (showHostId TEXT PRIMARY KEY, displayName TEXT NOT NULL, lowerThirdTitle TEXT)'
		);
		sql.exec('CREATE TABLE IF NOT EXISTS bans (userId TEXT PRIMARY KEY)');
		sql.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
	}

	// ---- connection lifecycle ------------------------------------------------------------

	async fetch(request: Request): Promise<Response> {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected WebSocket upgrade', { status: 426 });
		}

		const url = new URL(request.url);
		const showId = decodeURIComponent(url.pathname.split('/').pop() ?? '');
		if (showId) {
			this.setMeta('showId', showId);
		}

		const token = url.searchParams.get('token');
		let connection: ConnectionContext = { class: 'anonymous', userId: null };
		if (token) {
			const claims = await verifySessionToken(token, this.env.ORIGIN);
			if (claims) {
				connection = { class: claims.is_admin ? 'admin' : 'viewer', userId: claims.id };
			}
		}

		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];
		this.ctx.acceptWebSocket(server);
		server.serializeAttachment(connection);
		server.send(this.serverMessage({ type: 'snapshot', snapshot: this.snapshotFor(connection) }));

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws: WebSocket, raw: ArrayBuffer | string): Promise<void> {
		if (typeof raw !== 'string') {
			return;
		}

		let message: RoomClientMessage;
		try {
			message = JSON.parse(raw) as RoomClientMessage;
		} catch {
			return;
		}

		const connection = (ws.deserializeAttachment() as ConnectionContext | null) ?? {
			class: 'anonymous',
			userId: null
		};

		try {
			this.handle(ws, connection, message);
		} catch (error) {
			console.error('ShowRoom message failed', error);
			ws.send(this.serverMessage({ type: 'error', message: 'Unable to process request' }));
		}
	}

	webSocketError(_ws: WebSocket, error: unknown): void {
		console.error('ShowRoom socket error', error);
	}

	// Lower-third auto-hide. A single Alarm replaces an in-DO timer so the DO can hibernate.
	async alarm(): Promise<void> {
		this.setMeta('activeLowerThirdShowHostId', '');
		this.broadcast();
	}

	// ---- registry write-through (RPC from form actions) ----------------------------------

	// Called after the status→live D1 write: hydrate registry-origin caches once.
	async activate(showId: string): Promise<void> {
		this.setMeta('showId', showId);
		await this.hydrateFromRegistry(showId);
		this.broadcast();
	}

	// Re-hydrate host display names / titles after a registry edit (host reassign/rename).
	async syncHosts(showId: string): Promise<void> {
		this.setMeta('showId', showId);
		await this.hydrateFromRegistry(showId);
		this.broadcast();
	}

	// Mirror a ban/unban so the user's next submit/vote is blocked/allowed immediately.
	async setBan(userId: string, banned: boolean): Promise<void> {
		if (banned) {
			this.ctx.storage.sql.exec('INSERT OR IGNORE INTO bans (userId) VALUES (?)', userId);
		} else {
			this.ctx.storage.sql.exec('DELETE FROM bans WHERE userId = ?', userId);
		}
		this.broadcast();
	}

	private async hydrateFromRegistry(showId: string): Promise<void> {
		if (!showId) {
			return;
		}
		const db = drizzle(this.env.DB);
		const hosts = await db.select().from(showHosts).where(eq(showHosts.showId, showId));
		const banned = await db
			.select({ id: better_auth_user.id })
			.from(better_auth_user)
			.where(eq(better_auth_user.banned, true));

		const sql = this.ctx.storage.sql;
		sql.exec('DELETE FROM hosts');
		for (const host of hosts) {
			sql.exec(
				'INSERT INTO hosts (showHostId, displayName, lowerThirdTitle) VALUES (?, ?, ?)',
				host.id,
				host.displayName,
				host.lowerThirdTitle ?? null
			);
		}
		sql.exec('DELETE FROM bans');
		for (const row of banned) {
			sql.exec('INSERT OR IGNORE INTO bans (userId) VALUES (?)', row.id);
		}
	}

	// ---- message handling ----------------------------------------------------------------

	private handle(ws: WebSocket, connection: ConnectionContext, message: RoomClientMessage): void {
		const isAdmin = connection.class === 'admin';
		const reject = (text: string): void =>
			ws.send(this.serverMessage({ type: 'error', message: text }));

		switch (message.type) {
			case 'ticker:add': {
				if (!isAdmin) return reject('Admin access required');
				const text = message.text.trim();
				if (!text) return reject('Ticker message required');
				this.ctx.storage.sql.exec(
					'INSERT INTO ticker (id, text, createdAt) VALUES (?, ?, ?)',
					crypto.randomUUID(),
					text,
					Date.now()
				);
				return this.broadcast();
			}
			case 'ticker:delete': {
				if (!isAdmin) return reject('Admin access required');
				this.ctx.storage.sql.exec('DELETE FROM ticker WHERE id = ?', message.id);
				return this.broadcast();
			}
			case 'lowerThird:broadcast': {
				if (!isAdmin) return reject('Admin access required');
				const exists = this.ctx.storage.sql
					.exec('SELECT showHostId FROM hosts WHERE showHostId = ?', message.showHostId)
					.toArray();
				if (!exists.length) return reject('Host not found');
				this.setMeta('activeLowerThirdShowHostId', message.showHostId);
				this.ctx.storage.setAlarm(Date.now() + LOWER_THIRD_DISPLAY_MS);
				return this.broadcast();
			}
			case 'lowerThird:hide': {
				if (!isAdmin) return reject('Admin access required');
				this.setMeta('activeLowerThirdShowHostId', '');
				this.ctx.storage.deleteAlarm();
				return this.broadcast();
			}
			case 'submissions:setOpen': {
				if (!isAdmin) return reject('Admin access required');
				this.setMeta('submissionsOpen', message.open ? '1' : '0');
				return this.broadcast();
			}
			case 'submission:create': {
				if (connection.class === 'anonymous' || !connection.userId) {
					return reject('Sign in to submit');
				}
				if (this.isBanned(connection.userId)) return reject('Not allowed');
				if (this.getMeta('submissionsOpen') !== '1') return reject('Submissions are closed');
				const existing = this.ctx.storage.sql
					.exec('SELECT id FROM submissions WHERE authorId = ?', connection.userId)
					.toArray();
				if (existing.length) return reject('You already submitted');
				const url = message.url.trim();
				if (!url) return reject('URL required');
				this.ctx.storage.sql.exec(
					'INSERT INTO submissions (id, authorId, kind, url, title, notes, status, isFeatured, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)',
					crypto.randomUUID(),
					connection.userId,
					message.kind,
					url,
					message.title?.trim() || null,
					message.notes?.trim() || null,
					'pending',
					Date.now()
				);
				return this.broadcast();
			}
			case 'submission:setStatus': {
				if (!isAdmin) return reject('Admin access required');
				// Featuring requires approved status, so a submission leaving approved is unfeatured.
				if (message.status !== 'approved') {
					this.ctx.storage.sql.exec(
						'UPDATE submissions SET status = ?, isFeatured = 0 WHERE id = ?',
						message.status,
						message.id
					);
				} else {
					this.ctx.storage.sql.exec(
						'UPDATE submissions SET status = ? WHERE id = ?',
						message.status,
						message.id
					);
				}
				return this.broadcast();
			}
			case 'submission:delete': {
				if (!isAdmin) return reject('Admin access required');
				this.ctx.storage.sql.exec('DELETE FROM votes WHERE submissionId = ?', message.id);
				this.ctx.storage.sql.exec('DELETE FROM submissions WHERE id = ?', message.id);
				return this.broadcast();
			}
			case 'submission:feature': {
				if (!isAdmin) return reject('Admin access required');
				const rows = this.ctx.storage.sql
					.exec('SELECT status FROM submissions WHERE id = ?', message.id)
					.toArray();
				if (!rows.length || String(rows[0].status) !== 'approved') {
					return reject('Only approved submissions can be featured');
				}
				this.ctx.storage.sql.exec('UPDATE submissions SET isFeatured = 0');
				this.ctx.storage.sql.exec('UPDATE submissions SET isFeatured = 1 WHERE id = ?', message.id);
				return this.broadcast();
			}
			case 'submission:clearFeatured': {
				if (!isAdmin) return reject('Admin access required');
				this.ctx.storage.sql.exec('UPDATE submissions SET isFeatured = 0');
				return this.broadcast();
			}
			case 'vote:set': {
				if (connection.class === 'anonymous' || !connection.userId) {
					return reject('Sign in to vote');
				}
				if (this.isBanned(connection.userId)) return reject('Not allowed');
				const rows = this.ctx.storage.sql
					.exec('SELECT status, authorId FROM submissions WHERE id = ?', message.submissionId)
					.toArray();
				if (!rows.length || String(rows[0].status) !== 'approved') {
					return reject('Submission is not approved');
				}
				if (String(rows[0].authorId) === connection.userId) {
					return reject('Cannot vote on your own submission');
				}
				if (message.voted) {
					this.ctx.storage.sql.exec(
						'INSERT OR IGNORE INTO votes (submissionId, voterId) VALUES (?, ?)',
						message.submissionId,
						connection.userId
					);
				} else {
					this.ctx.storage.sql.exec(
						'DELETE FROM votes WHERE submissionId = ? AND voterId = ?',
						message.submissionId,
						connection.userId
					);
				}
				return this.broadcast();
			}
		}
	}

	// ---- snapshot + broadcast ------------------------------------------------------------

	private broadcast(): void {
		for (const socket of this.ctx.getWebSockets()) {
			const connection = (socket.deserializeAttachment() as ConnectionContext | null) ?? {
				class: 'anonymous',
				userId: null
			};
			try {
				socket.send(
					this.serverMessage({ type: 'snapshot', snapshot: this.snapshotFor(connection) })
				);
			} catch (error) {
				console.error('ShowRoom broadcast failed for a socket', error);
			}
		}
	}

	private snapshotFor(connection: ConnectionContext): RoomSnapshot {
		const sql = this.ctx.storage.sql;

		const ticker: TickerMessageView[] = sql
			.exec('SELECT id, text, createdAt FROM ticker ORDER BY createdAt ASC, id ASC')
			.toArray()
			.map((row) => ({
				id: String(row.id),
				text: String(row.text),
				createdAt: Number(row.createdAt)
			}));

		const activeHostId = this.getMeta('activeLowerThirdShowHostId');
		let lowerThird = null as RoomSnapshot['lowerThird'];
		if (activeHostId) {
			const hostRows = sql
				.exec(
					'SELECT showHostId, displayName, lowerThirdTitle FROM hosts WHERE showHostId = ?',
					activeHostId
				)
				.toArray();
			if (hostRows.length) {
				lowerThird = {
					showHostId: String(hostRows[0].showHostId),
					displayName: String(hostRows[0].displayName),
					lowerThirdTitle:
						hostRows[0].lowerThirdTitle === null ? null : String(hostRows[0].lowerThirdTitle)
				};
			}
		}

		const allRows = sql
			.exec(
				'SELECT id, authorId, kind, url, title, notes, status, isFeatured, createdAt FROM submissions ORDER BY createdAt DESC, id DESC'
			)
			.toArray();

		const toView = (row: (typeof allRows)[number]): SubmissionView => {
			const id = String(row.id);
			const voteCount = Number(
				sql.exec('SELECT COUNT(*) AS n FROM votes WHERE submissionId = ?', id).one().n
			);
			const hasVoted = connection.userId
				? sql
						.exec(
							'SELECT 1 FROM votes WHERE submissionId = ? AND voterId = ?',
							id,
							connection.userId
						)
						.toArray().length > 0
				: false;
			return {
				id,
				kind: String(row.kind) === 'tool' ? 'tool' : 'post',
				url: String(row.url),
				title: row.title === null ? null : String(row.title),
				notes: row.notes === null ? null : String(row.notes),
				status: String(row.status) as SubmissionStatus,
				isFeatured: Number(row.isFeatured) === 1,
				authorId: String(row.authorId),
				voteCount,
				hasVoted,
				createdAt: Number(row.createdAt)
			};
		};

		const views = allRows.map(toView);
		const visible = views.filter((view) => {
			if (connection.class === 'admin') return true;
			if (view.status === 'approved') return true;
			return connection.userId !== null && view.authorId === connection.userId;
		});
		const featured = views.find((view) => view.isFeatured && view.status === 'approved') ?? null;

		const canParticipate =
			connection.class !== 'anonymous' &&
			connection.userId !== null &&
			!this.isBanned(connection.userId);

		return {
			showId: this.getMeta('showId'),
			submissionsOpen: this.getMeta('submissionsOpen') === '1',
			canParticipate,
			ticker,
			lowerThird,
			submissions: visible,
			featured
		};
	}

	// ---- small helpers -------------------------------------------------------------------

	private isBanned(userId: string): boolean {
		return (
			this.ctx.storage.sql.exec('SELECT 1 FROM bans WHERE userId = ?', userId).toArray().length > 0
		);
	}

	private serverMessage(message: RoomServerMessage): string {
		return JSON.stringify(message);
	}

	private setMeta(key: string, value: string): void {
		this.ctx.storage.sql.exec('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', key, value);
	}

	private getMeta(key: string): string {
		const rows = this.ctx.storage.sql.exec('SELECT value FROM meta WHERE key = ?', key).toArray();
		return rows.length ? String(rows[0].value) : '';
	}
}
