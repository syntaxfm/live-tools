<script lang="ts">
	import HostShow from '$lib/components/shows/HostShow.svelte';

	let { data } = $props();
</script>

{#if data.liveShowId}
	<HostShow showId={data.liveShowId} />
{/if}
