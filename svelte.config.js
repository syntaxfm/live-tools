import { execSync } from 'node:child_process';
import adapter from '@sveltejs/adapter-cloudflare';

// The boot script in each HTML page sets `globalThis.__sveltekit_<hash of version.name>` and
// the client start chunk reads it. The default name is Date.now(), so every rebuild renames
// that global; while `wrangler dev` reloads mid-build it can serve new HTML with the old
// start chunk, which then reads `.data` of an undefined global (LIVE-CONTROL-32). Naming the
// version after the commit keeps the global stable across rebuilds of the same code.
function gitCommit() {
	try {
		return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
	} catch (error) {
		console.warn('Unable to read the git commit for the SvelteKit version name', error);
		return undefined;
	}
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
		experimental: {
			async: true
		}
	},
	kit: {
		// `config` points the adapter at a wrangler file whose `main` is the adapter's own
		// output path, kept distinct from the real wrangler.jsonc `main` (src/worker.ts).
		adapter: adapter({ config: 'wrangler.adapter.jsonc' }),

		version: { name: gitCommit() },

		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts', '../worker-configuration.d.ts'],
				// src/worker.ts statically imports the adapter's built worker (and its whole
				// SSR graph). Excluding it — plus the build output dirs — keeps svelte-check
				// from type-checking generated JS. The entry is compiled by wrangler/esbuild;
				// the Durable Object types it re-exports are checked at their source files.
				exclude: [
					...(config.exclude ?? []),
					'../src/worker.ts',
					'../.svelte-kit/cloudflare',
					'../.svelte-kit/cloudflare-tmp',
					'../.svelte-kit/output'
				]
			})
		}
	}
};

export default config;
