<script lang="ts">
	import { getSession } from 'jazz-tools/svelte';

	import AdminSubmissionQueue from '$lib/components/shows/AdminSubmissionQueue.svelte';
	import LowerThirdControls from '$lib/components/shows/LowerThirdControls.svelte';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';
	import ShowHostsPanel from '$lib/components/shows/ShowHostsPanel.svelte';
	import TickerControls from '$lib/components/shows/TickerControls.svelte';
	import OverlayURLs from './OverlayURLs.svelte';
	import type { Show } from '$lib/schema';

	let {
		show
	}: {
		show: Show;
	} = $props();

	const session = getSession();
	const isAdmin = $derived(session?.claims.isAdmin);
</script>

{#if isAdmin}
	<ShowStatePanel {show} />
	<ShowHostsPanel {show} />
	<LowerThirdControls {show} />
	<TickerControls {show} />
	<AdminSubmissionQueue {show} />
	<OverlayURLs />
{/if}
