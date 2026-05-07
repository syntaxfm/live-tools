<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';
	import { JazzSvelteProvider, createJazzClient } from 'jazz-tools/svelte';
	import { authClient } from '$lib/auth-client';
	import { onDestroy } from 'svelte';

	let { children } = $props();
	const session = authClient.useSession();

	let client = $state<ReturnType<typeof createJazzClient> | null>(null);

	const unsubscribe = session.subscribe((value) => {
		if (!value.isPending) {
			authClient.token().then(({ data }) => {
				client = createJazzClient({
					env: dev ? 'dev' : 'prod',
					appId: env.PUBLIC_JAZZ_APP_ID,
					jwtToken: data?.token ? data.token : undefined,
					serverUrl: env.PUBLIC_JAZZ_SERVER_URL || 'http://localhost:7012/'
				});
			});
		}
	});
	onDestroy(unsubscribe);
</script>

{#if client}
	<JazzSvelteProvider {client}>
		{@render children()}
	</JazzSvelteProvider>
{/if}
