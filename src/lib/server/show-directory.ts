import { DurableObject } from 'cloudflare:workers';

import type { DirectoryServerMessage } from '../components/shows/room-protocol';

/**
 * Singleton directory Durable Object (fixed id "live"). Announces which show is live so
 * overlays and the homepage auto-follow it — preserving zero-config discovery and the
 * "always fresh" rule. Announcer, not enforcer: the "at most one show live" invariant is
 * owned by D1's partial unique index. The status→live form action performs the atomic D1
 * write first, then calls setLiveShow() here (RPC) only on success.
 */
export class ShowDirectory extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		ctx.storage.sql.exec(
			'CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
		);
	}

	async fetch(request: Request): Promise<Response> {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected WebSocket upgrade', { status: 426 });
		}

		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];
		this.ctx.acceptWebSocket(server);
		server.send(this.message());

		return new Response(null, { status: 101, webSocket: client });
	}

	// The directory is read-only; clients never send messages. The Hibernation API still
	// requires a handler to be present for accepted sockets.
	webSocketMessage(): void {}

	webSocketError(_ws: WebSocket, error: unknown): void {
		console.error('ShowDirectory socket error', error);
	}

	// RPC: called by the status→live / status-away form action after the atomic D1 write.
	async setLiveShow(showId: string | null): Promise<void> {
		if (showId) {
			this.ctx.storage.sql.exec(
				"INSERT OR REPLACE INTO meta (key, value) VALUES ('liveShowId', ?)",
				showId
			);
		} else {
			this.ctx.storage.sql.exec("DELETE FROM meta WHERE key = 'liveShowId'");
		}

		const payload = this.message();
		for (const socket of this.ctx.getWebSockets()) {
			try {
				socket.send(payload);
			} catch (error) {
				console.error('ShowDirectory broadcast failed for a socket', error);
			}
		}
	}

	async getLiveShow(): Promise<string | null> {
		return this.liveShowId();
	}

	private liveShowId(): string | null {
		const rows = this.ctx.storage.sql
			.exec("SELECT value FROM meta WHERE key = 'liveShowId'")
			.toArray();
		return rows.length ? String(rows[0].value) : null;
	}

	private message(): string {
		return JSON.stringify({
			type: 'live',
			showId: this.liveShowId()
		} satisfies DirectoryServerMessage);
	}
}
