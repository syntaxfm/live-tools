<script lang="ts">
	import { QuerySubscription } from 'jazz-tools/svelte';
	import HostShow from '$lib/components/shows/HostShow.svelte';
	import { app } from '$lib/schema';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';

	const shows = new QuerySubscription(
		app.shows
			.where({
				status: 'live'
			})
			.orderBy('startsAt', 'desc')
	);
</script>

{#if shows.current?.[0]}
	<ShowStatePanel showId={shows.current[0].id} />
	<HostShow showId={shows.current[0].id} />
{/if}
