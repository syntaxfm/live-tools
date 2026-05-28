import { DurableObject } from 'cloudflare:workers';

/**
 * One Durable Object per show. Source of truth for that show's live "room state"
 * (ticker, lower-third, submissions, votes, featured). Persists to its own SQLite,
 * verifies the Better Auth JWT on connect, enforces permissions in its message
 * handlers, and fans out patches over WebSockets using the Hibernation API.
 *
 * See docs/adr/0002-websocket-hibernation-and-alarm-auto-hide.md — no in-DO
 * setInterval/setTimeout; the lower-third auto-hide uses a single Alarm.
 *
 * Built out across migration steps 4 and 5.
 */
export class ShowRoom extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected WebSocket upgrade', { status: 426 });
		}
		return new Response('Not implemented', { status: 501 });
	}
}
