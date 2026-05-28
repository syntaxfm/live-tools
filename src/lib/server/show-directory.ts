import { DurableObject } from 'cloudflare:workers';

/**
 * Singleton directory Durable Object (fixed id). Holds the current live show id and
 * pushes changes so overlays reconnect to the new room — preserving zero-config
 * auto-follow and the "always fresh" rule. It is an announcer, not an enforcer: the
 * "at most one show live" invariant is owned by D1 atomically (see the migration doc,
 * "Directory DO for live-show discovery").
 *
 * Built out in migration step 4.
 */
export class ShowDirectory extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected WebSocket upgrade', { status: 426 });
		}
		return new Response('Not implemented', { status: 501 });
	}
}
