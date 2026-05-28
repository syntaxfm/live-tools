import { authClient } from '$lib/auth-client';
import type {
	DirectoryServerMessage,
	RoomClientMessage,
	RoomServerMessage,
	RoomSnapshot
} from './room-protocol';

const RECONNECT_DELAY_MS = 1000;

function socketBase(): string {
	const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
	return `${protocol}://${location.host}`;
}

export async function sessionToken(): Promise<string | undefined> {
	try {
		const result = await authClient.token();
		return result?.data?.token ?? undefined;
	} catch {
		return undefined;
	}
}

/**
 * Reactive, reconnecting WebSocket connection to one show's ShowRoom Durable Object.
 * Replaces QuerySubscription as the primitive components read: `room.snapshot` holds the
 * DO's pre-shaped room state; `room.send(...)` issues authorized writes. The DO re-sends a
 * full snapshot on connect and on every change, so a reconnect (OBS teardown, network
 * blip) re-syncs by construction.
 */
export class ShowRoomStore {
	snapshot = $state<RoomSnapshot | null>(null);
	error = $state<string | null>(null);

	#socket: WebSocket | null = null;
	#showId: string | null = null;
	#authenticated: boolean;
	#closed = false;
	#reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	// `authenticated` opens the socket with the current session JWT (admin/viewer writes);
	// overlays leave it false and connect anonymously (read-only).
	constructor(options: { authenticated?: boolean } = {}) {
		this.#authenticated = options.authenticated ?? false;
	}

	connect(showId: string | null): void {
		if (showId === this.#showId) {
			return;
		}
		this.#showId = showId;
		this.#teardownSocket();
		this.snapshot = null;
		if (showId) {
			void this.#open();
		}
	}

	send(message: RoomClientMessage): void {
		if (this.#socket?.readyState === WebSocket.OPEN) {
			this.#socket.send(JSON.stringify(message));
		}
	}

	close(): void {
		this.#closed = true;
		this.#teardownSocket();
	}

	async #open(): Promise<void> {
		if (this.#closed || !this.#showId) {
			return;
		}
		const token = this.#authenticated ? await sessionToken() : undefined;
		if (this.#closed || !this.#showId) {
			return;
		}
		const query = token ? `?token=${encodeURIComponent(token)}` : '';
		const socket = new WebSocket(
			`${socketBase()}/_ws/room/${encodeURIComponent(this.#showId)}${query}`
		);
		this.#socket = socket;
		socket.addEventListener('message', (event) => this.#onMessage(event));
		socket.addEventListener('close', () => this.#onClose(socket));
		socket.addEventListener('error', () => socket.close());
	}

	#onMessage(event: MessageEvent): void {
		let message: RoomServerMessage;
		try {
			message = JSON.parse(String(event.data)) as RoomServerMessage;
		} catch {
			return;
		}
		if (message.type === 'snapshot') {
			this.snapshot = message.snapshot;
			this.error = null;
		} else if (message.type === 'error') {
			this.error = message.message;
		}
	}

	#onClose(socket: WebSocket): void {
		if (this.#socket !== socket) {
			return;
		}
		this.#socket = null;
		if (this.#closed || this.#reconnectTimer) {
			return;
		}
		this.#reconnectTimer = setTimeout(() => {
			this.#reconnectTimer = null;
			void this.#open();
		}, RECONNECT_DELAY_MS);
	}

	#teardownSocket(): void {
		if (this.#reconnectTimer) {
			clearTimeout(this.#reconnectTimer);
			this.#reconnectTimer = null;
		}
		const socket = this.#socket;
		this.#socket = null;
		socket?.close();
	}
}

/**
 * Follows whichever show is live via the singleton directory DO, driving an inner
 * ShowRoomStore to the live room and re-pointing it when the live show changes. This is
 * how overlays and the homepage auto-follow the live show with zero configuration.
 */
export class LiveShowStore {
	#room: ShowRoomStore;
	#directory: WebSocket | null = null;
	#closed = false;
	#reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(options: { authenticated?: boolean } = {}) {
		this.#room = new ShowRoomStore(options);
	}

	get snapshot(): RoomSnapshot | null {
		return this.#room.snapshot;
	}

	get error(): string | null {
		return this.#room.error;
	}

	send(message: RoomClientMessage): void {
		this.#room.send(message);
	}

	connect(): void {
		this.#openDirectory();
	}

	close(): void {
		this.#closed = true;
		if (this.#reconnectTimer) {
			clearTimeout(this.#reconnectTimer);
			this.#reconnectTimer = null;
		}
		this.#directory?.close();
		this.#directory = null;
		this.#room.close();
	}

	#openDirectory(): void {
		if (this.#closed) {
			return;
		}
		const socket = new WebSocket(`${socketBase()}/_ws/directory`);
		this.#directory = socket;
		socket.addEventListener('message', (event) => {
			let message: DirectoryServerMessage;
			try {
				message = JSON.parse(String(event.data)) as DirectoryServerMessage;
			} catch {
				return;
			}
			if (message.type === 'live') {
				this.#room.connect(message.showId);
			}
		});
		socket.addEventListener('close', () => this.#onDirectoryClose(socket));
		socket.addEventListener('error', () => socket.close());
	}

	#onDirectoryClose(socket: WebSocket): void {
		if (this.#directory !== socket) {
			return;
		}
		this.#directory = null;
		if (this.#closed || this.#reconnectTimer) {
			return;
		}
		this.#reconnectTimer = setTimeout(() => {
			this.#reconnectTimer = null;
			this.#openDirectory();
		}, RECONNECT_DELAY_MS);
	}
}
