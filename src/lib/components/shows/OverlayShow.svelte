<script lang="ts">
	import { createShowSubscription } from '$lib/components/shows/show-queries.svelte';
	import type { OverlayFeature } from '$lib/utils/overlays';

	interface Props {
		feature: OverlayFeature;
		showId: string | undefined;
	}

	let { feature, showId }: Props = $props();

	const shows = createShowSubscription(() => showId);
	const show = $derived(shows.current?.[0] ?? null);
</script>

{#if show}
	<section class="overlay-readout" data-feature={feature}></section>
{/if}
