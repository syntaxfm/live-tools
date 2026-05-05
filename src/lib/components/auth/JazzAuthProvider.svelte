<script lang="ts">
	import { dev } from '$app/environment';
	import { JazzSvelteProvider, createJazzClient } from 'jazz-tools/svelte';
	import type { JazzClient } from 'jazz-tools/svelte';

	import { getJwtFromBetterAuth } from '$lib/auth-client';
	import { getDevLocalFirstSecret } from '$lib/utils/dev-local-first';
	import { createJazzConfig } from '$lib/utils/jazz-config';

	interface Props {
		children: import('svelte').Snippet;
		identityMode?: JazzIdentityMode;
	}

	type JazzIdentityMode = 'authenticated-or-local-first' | 'anonymous-readonly';

	let { children, identityMode = 'authenticated-or-local-first' }: Props = $props();

	const client = initializeJazzClient(() => identityMode);

	async function initializeJazzClient(getMode: () => JazzIdentityMode): Promise<JazzClient> {
		const mode = getMode();

		if (mode === 'anonymous-readonly') {
			return createJazzClient(
				createJazzConfig({
					isDev: dev,
					jwtToken: null,
					localFirstSecret: null,
					storageMode: 'memory'
				})
			);
		}

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
