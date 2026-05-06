<script lang="ts">
	import { getSession, QuerySubscription } from 'jazz-tools/svelte';

	import HostShow from '$lib/components/shows/HostShow.svelte';
	import { getCurrentShow } from '$lib/utils/shows';
	import { app } from '$lib/schema';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';
	const shows = new QuerySubscription(app.shows.where({}), { tier: 'global' });
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
	const session = getSession();
	$inspect(session);
</script>

{#if currentShow}
	<ShowStatePanel showId={currentShow.id} />
	<HostShow showId={currentShow.id} />
{/if}
