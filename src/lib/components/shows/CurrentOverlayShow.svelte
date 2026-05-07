<script lang="ts">
	import OverlayShow from '$lib/components/shows/OverlayShow.svelte';
	import { app } from '$lib/schema';
	import { QuerySubscription } from 'jazz-tools/svelte';
	import type { OverlayFeature } from '$lib/utils/overlays';

	interface Props {
		feature: OverlayFeature;
	}

	let { feature }: Props = $props();
	const shows = new QuerySubscription(
		app.shows
			.where({
				status: 'live'
			})
			.orderBy('startsAt', 'desc')
	);
</script>

{#if shows.current?.[0]}
	<OverlayShow {feature} showId={shows.current[0].id} />
{/if}
