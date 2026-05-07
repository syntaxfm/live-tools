<script lang="ts">
	import FeaturedSubmissionOverlay from '$lib/components/shows/FeaturedSubmissionOverlay.svelte';
	import { app } from '$lib/schema';

	import { QuerySubscription } from 'jazz-tools/svelte';

	const shows = new QuerySubscription(
		app.shows
			.where({
				status: 'live'
			})
			.orderBy('startsAt', 'desc')
	);
</script>

{#if shows.current?.[0]}
	<FeaturedSubmissionOverlay showId={shows.current[0].id} />
{/if}
