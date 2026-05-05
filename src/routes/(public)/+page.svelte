<script lang="ts">
	import AudienceShow from '$lib/components/shows/AudienceShow.svelte';
	import { app } from '$lib/schema';
	import { getCurrentShow } from '$lib/utils/shows';
	import { QuerySubscription } from 'jazz-tools/svelte';

	const shows = new QuerySubscription(app.shows.where({}), { tier: 'global' });
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if shows.loading}
	<section class="surface" data-depth="medium">
		<p class="status" data-state="connecting">Loading show</p>
	</section>
{:else if shows.error}
	<section class="surface" data-depth="medium">
		<p class="status" data-state="warning">{shows.error.message}</p>
	</section>
{:else if currentShow}
	<AudienceShow showId={currentShow.id} />
{:else}
	<section class="surface" data-depth="medium">
		<p class="status" data-state="warning">No show</p>
	</section>
{/if}
