<script lang="ts">
	import ShowHostsReadout from '$lib/components/shows/ShowHostsReadout.svelte';
	import ShowReadout from '$lib/components/shows/ShowReadout.svelte';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();
</script>

<ShowReadout label="Host" {showId} surface="host" />
<ShowHostsReadout {showId} />
