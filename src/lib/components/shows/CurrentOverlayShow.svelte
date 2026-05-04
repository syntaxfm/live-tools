<script lang="ts">
	import OverlayShow from '$lib/components/shows/OverlayShow.svelte';
	import { createShowsSubscription } from '$lib/components/shows/show-queries.svelte';
	import type { OverlayFeature } from '$lib/utils/overlays';
	import { getCurrentShow } from '$lib/utils/shows';

	interface Props {
		feature: OverlayFeature;
	}

	let { feature }: Props = $props();

	const shows = createShowsSubscription();
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if currentShow}
	<OverlayShow {feature} showId={currentShow.id} />
{/if}
