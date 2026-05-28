import type { Auth, AuthSession } from '$lib/server/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			auth?: Auth;
			user?: AuthSession['user'];
			session?: AuthSession['session'];
		}

		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

// The SvelteKit Cloudflare worker is emitted by adapter-cloudflare at build time; the
// custom entry in src/worker.ts imports it to re-export the Durable Objects alongside
// the SvelteKit fetch handler. The built file only exists after `pnpm build`.
declare module '*_worker.js' {
	const worker: {
		fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
	};
	export default worker;
}

export {};
