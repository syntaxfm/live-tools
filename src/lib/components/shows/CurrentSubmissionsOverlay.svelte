<script lang="ts">
	import SubmissionsOverlay from '$lib/components/shows/SubmissionsOverlay.svelte';
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
	<SubmissionsOverlay showId={shows.current[0].id} />
{/if}
