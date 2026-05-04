<script lang="ts">
	import SubmissionsOverlay from '$lib/components/shows/SubmissionsOverlay.svelte';
	import { createShowsSubscription } from '$lib/components/shows/show-queries.svelte';
	import { getCurrentShow } from '$lib/utils/shows';

	const shows = createShowsSubscription();
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if currentShow}
	<SubmissionsOverlay showId={currentShow.id} />
{/if}
