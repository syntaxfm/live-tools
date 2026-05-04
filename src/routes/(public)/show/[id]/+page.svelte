<script lang="ts">
	import { page } from '$app/state';

	import AudienceShow from '$lib/components/shows/AudienceShow.svelte';
</script>

<AudienceShow showId={page.params.id} />
