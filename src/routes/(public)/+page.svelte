<script lang="ts">
	import AudienceShow from '$lib/components/shows/AudienceShow.svelte';
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
	<AudienceShow showId={shows.current[0].id} />
{/if}
