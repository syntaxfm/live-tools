<script lang="ts">
	import OverlayShow from '$lib/components/shows/OverlayShow.svelte';
	import { app } from '$lib/schema';
	import type { OverlayFeature } from '$lib/utils/overlays';
	import { getCurrentShow } from '$lib/utils/shows';
	import { QuerySubscription } from 'jazz-tools/svelte';

	interface Props {
		feature: OverlayFeature;
	}

	let { feature }: Props = $props();

	const shows = new QuerySubscription(app.shows.where({}), { tier: 'global' });
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if currentShow}
	<OverlayShow {feature} showId={currentShow.id} />
{/if}
