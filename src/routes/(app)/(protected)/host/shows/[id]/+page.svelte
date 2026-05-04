<script lang="ts">
	import { page } from '$app/state';

	import HostShow from '$lib/components/shows/HostShow.svelte';
</script>

<HostShow showId={page.params.id} />
