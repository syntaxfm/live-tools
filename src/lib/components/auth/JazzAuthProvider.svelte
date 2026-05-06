<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';
	import { JazzSvelteProvider, createJazzClient } from 'jazz-tools/svelte';
	import { getJwtFromBetterAuth } from '$lib/auth-client';

	import { page } from '$app/state';

	interface Props {
		children: import('svelte').Snippet;
		identityMode?: JazzIdentityMode;
	}

	type JazzIdentityMode = 'auth' | 'anon';

	let { children }: Props = $props();

	const mode = $derived(page.url.pathname.startsWith('/overlay') ? 'anon' : 'auth');

	const jwt = await getJwtFromBetterAuth();
	const client = createJazzClient({
		env: dev ? 'dev' : 'prod',
		appId: env.PUBLIC_JAZZ_APP_ID,
		jwtToken: jwt ? jwt : undefined,
		driver: mode === 'auth' ? { type: 'memory' } : undefined,
		serverUrl: env.PUBLIC_JAZZ_SERVER_URL || 'https://localhost:7012/'
	});
</script>

<JazzSvelteProvider {client}>
	{@render children()}
</JazzSvelteProvider>
