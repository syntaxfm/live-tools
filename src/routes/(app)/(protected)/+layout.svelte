<script lang="ts">
	import { getClientSession } from '$lib/session.svelte';
	let { children } = $props();

	const session = getClientSession();
</script>

{#if session.isLoggedIn}
	{@render children()}
{/if}
