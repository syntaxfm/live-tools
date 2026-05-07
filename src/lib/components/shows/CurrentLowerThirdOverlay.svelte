<script lang="ts">
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
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
	<LowerThirdOverlay showId={shows.current[0].id} />
{/if}
