<script lang="ts">
	import { getSession } from 'jazz-tools/svelte';
	let { children } = $props();

	const session = getSession();
</script>

{#if session?.user_id}
	{@render children()}
{/if}
