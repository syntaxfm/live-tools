<script lang="ts">
	import { createShowsSubscription } from '$lib/components/shows/show-queries.svelte';
	import AudienceShow from '$lib/components/shows/AudienceShow.svelte';
	import { getCurrentShow } from '$lib/utils/shows';

	const shows = createShowsSubscription();
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if shows.loading}
	<section class="surface" data-depth="medium">
		<h1>Pole</h1>
		<p class="status" data-state="connecting">Loading show</p>
	</section>
{:else if shows.error}
	<section class="surface" data-depth="medium">
		<h1>Pole</h1>
		<p class="status" data-state="warning">{shows.error.message}</p>
	</section>
{:else if currentShow}
	<AudienceShow showId={currentShow.id} />
{:else}
	<section class="surface" data-depth="medium">
		<h1>Pole</h1>
		<p class="status" data-state="warning">No show</p>
	</section>
{/if}
