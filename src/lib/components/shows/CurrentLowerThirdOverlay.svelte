<script lang="ts">
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
	import { createShowsSubscription } from '$lib/components/shows/show-queries.svelte';
	import { getCurrentShow } from '$lib/utils/shows';

	const shows = createShowsSubscription();
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if currentShow}
	<LowerThirdOverlay showId={currentShow.id} />
{/if}
