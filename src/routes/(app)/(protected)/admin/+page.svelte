<script lang="ts">
	import { QuerySubscription } from 'jazz-tools/svelte';
	import type { PageData } from './$types';

	import ShowControlRoom from '$lib/components/shows/ShowControlRoom.svelte';
	import { app } from '$lib/schema';
	import { getCurrentShow } from '$lib/utils/shows';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const shows = new QuerySubscription(app.shows.where({}), { tier: 'global' });
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if currentShow}
	<ShowControlRoom hostOptions={data.adminHostOptions} showId={currentShow.id} />
{/if}
