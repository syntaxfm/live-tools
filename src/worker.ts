import * as Sentry from '@sentry/cloudflare';
// adapter-cloudflare writes the SvelteKit worker here (see wrangler.adapter.jsonc, the
// config passed to the adapter). wrangler runs THIS file as `main` instead, so we can
// re-export the Durable Objects and wrap the fetch handler — capabilities the adapter's
// generated worker does not provide on its own (sveltejs/kit#15627 is still unreleased).
import sv from '../.svelte-kit/cloudflare/_worker.js';
import { ShowRoom } from './lib/server/show-room';
import { ShowDirectory } from './lib/server/show-directory';

export { ShowRoom, ShowDirectory };

export default Sentry.withSentry(
	() => ({
		dsn: 'https://d5f9d63fc06bdce24d0dfc36f3cc33d2@o4507217476845568.ingest.us.sentry.io/4511338880434176',
		tracesSampleRate: 1.0,
		enableLogs: true
	}),
	{
		fetch(request, env, ctx) {
			// Route WebSocket upgrades straight to the Durable Objects; everything else is
			// the SvelteKit app. The DOs own all live room state + fan-out.
			const url = new URL(request.url);
			if (url.pathname === '/_ws/directory') {
				return env.SHOW_DIRECTORY.get(env.SHOW_DIRECTORY.idFromName('live')).fetch(request);
			}
			const roomMatch = url.pathname.match(/^\/_ws\/room\/(.+)$/);
			if (roomMatch) {
				const showId = decodeURIComponent(roomMatch[1]);
				return env.SHOW_ROOM.get(env.SHOW_ROOM.idFromName(showId)).fetch(request);
			}
			return sv.fetch(request, env, ctx);
		}
	} satisfies ExportedHandler<Env>
);
