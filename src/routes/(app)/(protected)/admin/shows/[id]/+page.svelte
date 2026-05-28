<script lang="ts">
	import OverlayURLs from '$lib/components/shows/OverlayURLs.svelte';
	import TickerControls from '$lib/components/shows/TickerControls.svelte';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';
	import ShowHostsPanel from '$lib/components/shows/ShowHostsPanel.svelte';
	import LowerThirdControls from '$lib/components/shows/LowerThirdControls.svelte';
	import AdminSubmissionQueue from '$lib/components/shows/AdminSubmissionQueue.svelte';
	import { ShowRoomStore } from '$lib/components/shows/room.svelte';

	let { data } = $props();

	// The admin console reads/writes this show's room over an authenticated socket. Registry
	// edits (status, host assignment, host titles) go through this page's form actions.
	const room = new ShowRoomStore({ authenticated: true });

	$effect(() => {
		room.connect(data.show.id);
		return () => room.connect(null);
	});
</script>

<ShowStatePanel show={data.show} {room} />
<ShowHostsPanel hosts={data.hosts} eligibleHosts={data.eligibleHosts} />
<LowerThirdControls hosts={data.hosts} {room} />
<TickerControls {room} />
<AdminSubmissionQueue {room} />
<OverlayURLs />
