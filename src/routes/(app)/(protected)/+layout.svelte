<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getDb, getJazzContext } from 'jazz-tools/svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	const db = getDb();
	const jazzContext = getJazzContext();
	$inspect(jazzContext.session);
	const isExternalSession = $derived(jazzContext.session?.authMode === 'external');

	onMount(() => {
		function redirectIfSignedOut(): void {
			if (jazzContext.session && !isExternalSession) {
				void goto(resolve('/login'));
			}
		}

		redirectIfSignedOut();

		const unsubscribe = db.onAuthChanged(() => {
			redirectIfSignedOut();
		});

		return unsubscribe;
	});
</script>

{#if isExternalSession}
	{@render children()}
{:else}
	<section class="surface">
		<p class="status" data-state="connecting">Checking session</p>
	</section>
{/if}
