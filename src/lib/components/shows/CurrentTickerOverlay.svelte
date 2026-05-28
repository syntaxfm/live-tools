<script lang="ts">
	import { onMount } from 'svelte';
	import TickerOverlay from '$lib/components/shows/TickerOverlay.svelte';
	import { LiveShowStore } from '$lib/components/shows/room.svelte';

	// Anonymous, read-only. Follows whichever show is live via the directory DO and
	// re-syncs from the room snapshot on every (re)connect — the OBS-resilient path.
	const room = new LiveShowStore();

	onMount(() => {
		room.connect();
		return () => room.close();
	});
</script>

{#if room.snapshot && room.snapshot.ticker.length}
	<TickerOverlay messages={room.snapshot.ticker} />
{/if}
