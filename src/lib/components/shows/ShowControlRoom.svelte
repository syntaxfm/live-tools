<script lang="ts">
	import OverlayURLs from './OverlayURLs.svelte';
	import { getJazzContext } from 'jazz-tools/svelte';

	import AdminSubmissionQueue from '$lib/components/shows/AdminSubmissionQueue.svelte';
	import LowerThirdControls from '$lib/components/shows/LowerThirdControls.svelte';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';
	import TickerControls from '$lib/components/shows/TickerControls.svelte';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const jazzContext = getJazzContext();
	const isAdmin = $derived(jazzContext.session?.claims.isAdmin === true);
</script>

{#if isAdmin}
	<ShowStatePanel {showId} />
	<LowerThirdControls {showId} />
	<TickerControls {showId} />
	<AdminSubmissionQueue {showId} />
	<OverlayURLs />
{/if}
