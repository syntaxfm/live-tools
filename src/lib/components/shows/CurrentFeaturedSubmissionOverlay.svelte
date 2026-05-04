<script lang="ts">
	import FeaturedSubmissionOverlay from '$lib/components/shows/FeaturedSubmissionOverlay.svelte';
	import { createShowsSubscription } from '$lib/components/shows/show-queries.svelte';
	import { getCurrentShow } from '$lib/utils/shows';

	const shows = createShowsSubscription();
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if currentShow}
	<FeaturedSubmissionOverlay showId={currentShow.id} />
{/if}
