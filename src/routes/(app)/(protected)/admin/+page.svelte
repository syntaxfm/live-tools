<script lang="ts">
	import { resolve } from '$app/paths';

	import { createShowsSubscription } from '$lib/components/shows/show-queries.svelte';
	import ShowControlRoom from '$lib/components/shows/ShowControlRoom.svelte';
	import { getCurrentShow } from '$lib/utils/shows';

	const shows = createShowsSubscription();
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if shows.loading}
	<section class="surface" data-depth="medium">
		<p class="section-label">Admin</p>
		<h1>Show</h1>
		<p class="status" data-state="connecting">Loading show</p>
	</section>
{:else if shows.error}
	<section class="surface" data-depth="medium">
		<p class="section-label">Admin</p>
		<h1>Show</h1>
		<p class="status" data-state="warning">{shows.error.message}</p>
	</section>
{:else if currentShow}
	<ShowControlRoom showId={currentShow.id} />
{:else}
	<section class="surface" data-depth="medium">
		<p class="section-label">Admin</p>
		<h1>No show</h1>
		<p>
			<a href={resolve('/admin/shows')}>Shows</a>
		</p>
	</section>
{/if}
