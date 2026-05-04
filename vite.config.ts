import { sveltekit } from '@sveltejs/kit/vite';
import { jazzSvelteKit } from 'jazz-tools/dev/sveltekit';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const appOrigin = env.APP_ORIGIN || env.ORIGIN || 'http://localhost:7011';

	if (mode === 'development') {
		process.env.POLE_ENABLE_DEV_LOCAL_FIRST_SUBMISSIONS = 'true';
	}

	return {
		plugins: [
			jazzSvelteKit({
				schemaDir: 'src/lib',
				server: {
					jwksUrl: `${appOrigin}/api/auth/jwks`
				}
			}),
			sveltekit()
		],
		server: {
			port: 7011,
			strictPort: true
		},
		ssr: {
			external: ['jazz-tools/backend']
		}
	};
});
