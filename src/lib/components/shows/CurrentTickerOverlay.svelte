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
			.include({ tickerMessagesViaShow: app.tickerMessages.where({}) })
	);
</script>

{#if shows.current?.[0]}
	<TickerOverlay show={shows.current?.[0]} />
{/if}
