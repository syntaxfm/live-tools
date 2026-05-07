<script lang="ts">
	import { QuerySubscription } from 'jazz-tools/svelte';
	import TickerOverlay from '$lib/components/shows/TickerOverlay.svelte';
	import { app } from '$lib/schema';

	const shows = new QuerySubscription(
		app.shows
			.where({
				status: 'live'
			})
			.orderBy('startsAt', 'desc')
	);
</script>

{#if shows.current?.[0]}
	<TickerOverlay showId={shows.current[0].id} />
{/if}
