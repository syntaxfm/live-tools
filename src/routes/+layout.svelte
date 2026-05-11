<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';
	import { JazzSvelteProvider, createJazzClient } from 'jazz-tools/svelte';
	import { authClient } from '$lib/auth-client';
	import { onDestroy } from 'svelte';

	let { children } = $props();
	const session = authClient.useSession();

	let client = $state<ReturnType<typeof createJazzClient> | null>(null);
	let user_id: string | null | undefined = $state(null);

	const unsubscribe = session.subscribe((value) => {
		// IF the user changes aka if the cached user_id is not equal to the current user_id
		// Recreate the jazz client
		if (value?.data?.user.id !== user_id) {
			user_id = value.data?.user?.id;

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

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if client}
	<JazzSvelteProvider {client}>
		{@render children()}
	</JazzSvelteProvider>
{/if}
