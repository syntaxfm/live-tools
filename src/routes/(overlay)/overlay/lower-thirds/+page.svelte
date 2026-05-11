<script lang="ts">
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
	import { app } from '$lib/schema';
	import { QuerySubscription } from 'jazz-tools/svelte';

	const shows = new QuerySubscription(() =>
		app.shows
			.where({
				status: 'live'
			})
			.orderBy('startsAt', 'desc')
			.include({
				activeLowerThirdShowHost: true
			})
	);
</script>

{#if shows.current?.[0]}
	<LowerThirdOverlay show={shows.current[0]} />
{/if}
