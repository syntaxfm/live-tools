<script lang="ts">
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
	import { app } from '$lib/schema';
	import { getCurrentShow } from '$lib/utils/shows';
	import { QuerySubscription } from 'jazz-tools/svelte';

	const shows = new QuerySubscription(app.shows.where({}), { tier: 'global' });
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if currentShow}
	<LowerThirdOverlay showId={currentShow.id} />
{/if}
