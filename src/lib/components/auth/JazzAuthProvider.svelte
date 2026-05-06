<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';
	import { JazzSvelteProvider, createJazzClient } from 'jazz-tools/svelte';
	import { authClient } from '$lib/auth-client';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';

	interface Props {
		children: import('svelte').Snippet;
		identityMode?: JazzIdentityMode;
	}

	type JazzIdentityMode = 'auth' | 'anon';

	let { children }: Props = $props();
	const session = authClient.useSession();

	let client = $state<ReturnType<typeof createJazzClient> | null>(null);
	const mode = $derived(page.url.pathname.startsWith('/overlay') ? 'anon' : 'auth');

	const unsubscribe = session.subscribe((value) => {
		authClient.token().then(({ data }) => {
			client = createJazzClient({
				env: dev ? 'dev' : 'prod',
				appId: env.PUBLIC_JAZZ_APP_ID,
				jwtToken: data?.token ? data.token : undefined,
				driver: mode === 'auth' ? { type: 'memory' } : undefined,
				serverUrl: env.PUBLIC_JAZZ_SERVER_URL || 'http://localhost:7012/'
			});
		});
	});
	onDestroy(unsubscribe);
</script>

{#if client}
	<JazzSvelteProvider {client}>
		{@render children()}
	</JazzSvelteProvider>
{/if}
