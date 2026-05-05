<script lang="ts">
	import AudienceShow from '$lib/components/shows/AudienceShow.svelte';
	import { app } from '$lib/schema';
	import { getCurrentShow } from '$lib/utils/shows';
	import { QuerySubscription } from 'jazz-tools/svelte';

	const shows = new QuerySubscription(app.shows.where({}), { tier: 'global' });
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

hii

{#if currentShow}
	<AudienceShow showId={currentShow.id} />
{/if}
