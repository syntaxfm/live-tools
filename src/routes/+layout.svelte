<script lang="ts">
	import '../app.css';
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';
	import { JazzSvelteProvider, createJazzClient } from 'jazz-tools/svelte';
	import { authClient } from '$lib/auth-client';

	let { children } = $props();

	const jwt = await authClient.token();
	const client = createJazzClient({
		env: dev ? 'dev' : 'prod',
		appId: env.PUBLIC_JAZZ_APP_ID,
		jwtToken: jwt?.data?.token ?? undefined,
		serverUrl: env.PUBLIC_JAZZ_SERVER_URL || 'http://localhost:7012/'
	});
</script>

<JazzSvelteProvider {client}>
	{@render children()}
</JazzSvelteProvider>
