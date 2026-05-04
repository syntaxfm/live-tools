<script lang="ts">
	import { dev } from '$app/environment';
	import { JazzSvelteProvider, createJazzClient } from 'jazz-tools/svelte';
	import type { DbConfig } from 'jazz-tools';
	import type { JazzClient } from 'jazz-tools/svelte';
	import { onMount } from 'svelte';

	import { authClient, getJwtFromBetterAuth } from '$lib/auth-client';
	import { getDevLocalFirstSecret } from '$lib/utils/dev-local-first';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const betterAuthSession = authClient.useSession();

	let client = $state<Promise<JazzClient> | null>(null);
	let isResolvingAuth = $state(true);
	let authError = $state<Error | null>(null);
	let authRequestId = 0;

	function createConfig(jwtToken: string | null, localFirstSecret: string | null): DbConfig {
		const appId = import.meta.env.PUBLIC_JAZZ_APP_ID;
		const serverUrl = import.meta.env.PUBLIC_JAZZ_SERVER_URL;

		if (!appId) {
			throw new Error('PUBLIC_JAZZ_APP_ID is required for Jazz');
		}

		if (!serverUrl) {
			throw new Error('PUBLIC_JAZZ_SERVER_URL is required for Jazz');
		}

		const config: DbConfig = {
			appId,
			env: dev ? 'dev' : 'prod',
			userBranch: 'main',
			serverUrl
		};

		if (jwtToken) {
			config.jwtToken = jwtToken;
		} else if (localFirstSecret) {
			config.secret = localFirstSecret;
		}

		return config;
	}

	async function refreshJazzClient(authState: ReturnType<typeof betterAuthSession.get>) {
		const requestId = ++authRequestId;

		if (authState.isPending) {
			isResolvingAuth = true;
			return;
		}

		isResolvingAuth = true;
		authError = null;

		const hasBetterAuthSession = Boolean(authState.data?.session.id);
		const jwtToken = hasBetterAuthSession ? await getJwtFromBetterAuth() : null;
		const localFirstSecret = !hasBetterAuthSession && dev ? getDevLocalFirstSecret() : null;

		if (requestId !== authRequestId) {
			return;
		}

		if (hasBetterAuthSession && !jwtToken) {
			client = null;
			authError = new Error('Unable to get Better Auth JWT for Jazz');
			isResolvingAuth = false;
			return;
		}

		client = createJazzClient(createConfig(jwtToken, localFirstSecret));
		isResolvingAuth = false;
	}

	onMount(() => {
		const unsubscribe = betterAuthSession.subscribe((authState) => {
			void refreshJazzClient(authState);
		});

		return unsubscribe;
	});
</script>

{#if authError}
	{(() => {
		throw authError;
	})()}
{:else if client && !isResolvingAuth}
	<JazzSvelteProvider {client}>
		{@render children()}
	</JazzSvelteProvider>
{/if}
