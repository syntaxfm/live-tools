<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';

	import ShowControlRoom from '$lib/components/shows/ShowControlRoom.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<ShowControlRoom hostOptions={data.adminHostOptions} showId={page.params.id} />
