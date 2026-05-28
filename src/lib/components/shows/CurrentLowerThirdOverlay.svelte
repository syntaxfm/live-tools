<script lang="ts">
	import { onMount } from 'svelte';
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
	import { LiveShowStore } from '$lib/components/shows/room.svelte';

	const room = new LiveShowStore();

	onMount(() => {
		room.connect();
		return () => room.close();
	});
</script>

<LowerThirdOverlay host={room.snapshot?.lowerThird ?? null} />
