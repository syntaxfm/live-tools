<script lang="ts">
	import { getJazzContext } from 'jazz-tools/svelte';

	import AdminSubmissionQueue from '$lib/components/shows/AdminSubmissionQueue.svelte';
	import type { ShowHostOption } from '$lib/components/shows/show-host-options';
	import LowerThirdControls from '$lib/components/shows/LowerThirdControls.svelte';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';
	import ShowHostsPanel from '$lib/components/shows/ShowHostsPanel.svelte';
	import TickerControls from '$lib/components/shows/TickerControls.svelte';
	import OverlayURLs from './OverlayURLs.svelte';

	interface Props {
		hostOptions: readonly ShowHostOption[];
		showId: string | undefined;
	}

	let { hostOptions, showId }: Props = $props();

	const jazzContext = getJazzContext();
	const isAdmin = $derived(jazzContext.session?.claims.isAdmin === true);
</script>

{#if isAdmin}
	<ShowStatePanel {showId} />
	<ShowHostsPanel {hostOptions} {showId} />
	<LowerThirdControls {showId} />
	<TickerControls {showId} />
	<AdminSubmissionQueue {showId} />
	<OverlayURLs />
{/if}
