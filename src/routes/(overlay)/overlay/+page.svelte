<script lang="ts">
	import { onMount } from 'svelte';
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
	import SubmissionsOverlay from '$lib/components/shows/SubmissionsOverlay.svelte';
	import TickerOverlay from '$lib/components/shows/TickerOverlay.svelte';
	import { LiveShowStore } from '$lib/components/shows/room.svelte';

	// One anonymous connection drives the whole combined overlay (a single OBS source).
	const room = new LiveShowStore();

	onMount(() => {
		room.connect();
		return () => room.close();
	});
</script>

{#if room.snapshot}
	<div class="overlay-stack">
		<div class="slot slot--lower-third">
			<LowerThirdOverlay host={room.snapshot.lowerThird} />
		</div>
		<div class="slot slot--submissions">
			<SubmissionsOverlay submissions={room.snapshot.submissions} />
		</div>
		<div class="slot slot--ticker">
			<TickerOverlay messages={room.snapshot.ticker} />
		</div>
	</div>
{/if}

<style>
	.overlay-stack {
		position: absolute;
		inset: 0;
	}

	.slot {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.slot--ticker {
		top: auto;
		height: 140px;
	}

	.slot--lower-third,
	.slot--submissions {
		bottom: 140px;
	}
</style>
