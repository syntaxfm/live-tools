<script lang="ts">
	import { dev } from '$app/environment';
	import { JazzSvelteProvider, createJazzClient } from 'jazz-tools/svelte';
	import type { JazzClient } from 'jazz-tools/svelte';

	import { getJwtFromBetterAuth } from '$lib/auth-client';
	import { getDevLocalFirstSecret } from '$lib/utils/dev-local-first';
	import { createJazzConfig } from '$lib/utils/jazz-config';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const client = initializeJazzClient();

	async function initializeJazzClient(): Promise<JazzClient> {
		const jwtToken = await getJwtFromBetterAuth();
		const localFirstSecret = jwtToken || !dev ? null : getDevLocalFirstSecret();

		return createJazzClient(
			createJazzConfig({
				isDev: dev,
				jwtToken,
				localFirstSecret
			})
		);
	}
</script>

<JazzSvelteProvider {client}>
	{@render children()}
</JazzSvelteProvider>
