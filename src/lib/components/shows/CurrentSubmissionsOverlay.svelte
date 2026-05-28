<script lang="ts">
	import { onMount } from 'svelte';
	import SubmissionsOverlay from '$lib/components/shows/SubmissionsOverlay.svelte';
	import { LiveShowStore } from '$lib/components/shows/room.svelte';

	// Anonymous connection: the DO shapes its snapshot to approved submissions only.
	const room = new LiveShowStore();

	onMount(() => {
		room.connect();
		return () => room.close();
	});
</script>

<SubmissionsOverlay submissions={room.snapshot?.submissions ?? []} />
