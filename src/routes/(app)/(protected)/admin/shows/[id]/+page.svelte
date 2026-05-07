<script lang="ts">
	import { getSession, QuerySubscription } from 'jazz-tools/svelte';
	import { app } from '$lib/schema';
	import OverlayURLs from '$lib/components/shows/OverlayURLs.svelte';
	import AdminSubmissionQueue from '$lib/components/shows/AdminSubmissionQueue.svelte';
	import TickerControls from '$lib/components/shows/TickerControls.svelte';
	import LowerThirdControls from '$lib/components/shows/LowerThirdControls.svelte';
	import ShowHostsPanel from '$lib/components/shows/ShowHostsPanel.svelte';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';
	import { page } from '$app/state';

	const shows = new QuerySubscription(
		app.shows
			.where({
				id: page.params.id
			})
			.orderBy('startsAt', 'desc')
			.include({ tickerMessagesViaShow: app.tickerMessages.where({}).orderBy('position', 'asc') })
	);
	const session = getSession();
	const isAdmin = $derived(session?.claims.isAdmin);
	const show = $derived(shows.current?.[0]);
</script>

{#if show && isAdmin}
	<ShowStatePanel {show} />
	<ShowHostsPanel {show} />
	<LowerThirdControls {show} />
	<TickerControls {show} />
	<AdminSubmissionQueue {show} />
	<OverlayURLs />
{/if}
