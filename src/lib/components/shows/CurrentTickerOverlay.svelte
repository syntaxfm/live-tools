<script lang="ts">
	import { QuerySubscription } from 'jazz-tools/svelte';

	import TickerOverlay from '$lib/components/shows/TickerOverlay.svelte';
	import { app } from '$lib/schema';
	import { getCurrentShow } from '$lib/utils/shows';

	const shows = new QuerySubscription(app.shows.where({}), { tier: 'global' });
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if currentShow}
	<TickerOverlay showId={currentShow.id} />
{/if}
