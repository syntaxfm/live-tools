<script lang="ts">
	import { getSession } from 'jazz-tools/svelte';

	let { children } = $props();

	const session = getSession();
	const isExternalSession = $derived(session?.authMode === 'external');
</script>

{#if isExternalSession}
	{@render children()}
{/if}
