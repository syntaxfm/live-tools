import adapter from '@sveltejs/adapter-cloudflare';

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
