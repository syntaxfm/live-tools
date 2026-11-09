<script lang="ts">
	import { onMount } from 'svelte';
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
	import OverlayDesignPreview from '$lib/components/shows/OverlayDesignPreview.svelte';
	import TickerOverlay from '$lib/components/shows/TickerOverlay.svelte';
	import { LiveShowStore } from '$lib/components/shows/room.svelte';

	// The single OBS browser source: one anonymous connection follows the live show and
	// drives every layer below. Add a new on-air graphic as another .slot.
	const room = new LiveShowStore();

	// /overlay?preview is the design surface: stubbed layers, local footage, and trigger
	// buttons. OBS loads plain /overlay, which stays transparent and only shows real data.
	const isPreview = new URLSearchParams(location.search).has('preview');

	onMount(() => {
		room.connect();
		return () => room.close();
	});
</script>

{#if isPreview}
	<OverlayDesignPreview liveLowerThird={room.snapshot?.lowerThird ?? null} />
{:else if room.snapshot}
	<div class="overlay-stack">
		<div class="slot slot--lower-third">
			<LowerThirdOverlay host={room.snapshot.lowerThird} />
		</div>
		{#if room.snapshot.ticker.length}
			<div class="slot slot--ticker">
				<TickerOverlay messages={room.snapshot.ticker} />
			</div>
		{/if}
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

	.slot--lower-third {
		bottom: 140px;
	}
</style>
