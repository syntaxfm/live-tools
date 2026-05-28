<script lang="ts">
	import { onMount } from 'svelte';
	import FeaturedSubmissionOverlay from '$lib/components/shows/FeaturedSubmissionOverlay.svelte';
	import { LiveShowStore } from '$lib/components/shows/room.svelte';

	const room = new LiveShowStore();

	onMount(() => {
		room.connect();
		return () => room.close();
	});
</script>

<FeaturedSubmissionOverlay featured={room.snapshot?.featured ?? null} />
