<script lang="ts">
	import { QuerySubscription } from 'jazz-tools/svelte';
	import ShowControlRoom from '$lib/components/shows/ShowControlRoom.svelte';
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
	<ShowControlRoom show={shows.current[0]} />
{/if}
