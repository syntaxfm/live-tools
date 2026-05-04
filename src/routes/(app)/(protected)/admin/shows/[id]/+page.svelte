<script lang="ts">
	import { page } from '$app/state';

	import ShowControlRoom from '$lib/components/shows/ShowControlRoom.svelte';
</script>

<ShowControlRoom showId={page.params.id} />
