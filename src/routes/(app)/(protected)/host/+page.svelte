<script lang="ts">
	import { getJazzContext } from 'jazz-tools/svelte';

	import { createCurrentAppUserSubscription } from '$lib/components/auth/current-app-user.svelte';
	import HostShow from '$lib/components/shows/HostShow.svelte';
	import { createShowsSubscription } from '$lib/components/shows/show-queries.svelte';
	import { getCurrentShow } from '$lib/utils/shows';

	const jazzContext = getJazzContext();
	const appUsers = createCurrentAppUserSubscription();
	const shows = createShowsSubscription();
	const appUser = $derived(appUsers.current?.[0] ?? null);
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
	const roleLabel = $derived(jazzContext.session?.claims.isAdmin === true ? 'admin' : 'viewer');
</script>

{#if appUsers.loading || shows.loading}
	<section class="surface" data-depth="medium">
		<p class="section-label">Host</p>
		<h1>Host</h1>
		<p class="status" data-state="connecting">Loading show</p>
	</section>
{:else if appUser && currentShow}
	<HostShow showId={currentShow.id} />
{:else if appUser}
	<section class="surface" data-depth="medium">
		<p class="section-label">Host</p>
		<h1>Host</h1>
		<p class="status" data-state="warning">No show</p>
		<p>
			<span class="badge">{roleLabel}</span>
		</p>
	</section>
{:else}
	<section class="surface" data-depth="medium">
		<p class="section-label">Host</p>
		<h1>Host</h1>
		<p class="status" data-state="warning">Creating profile</p>
	</section>
{/if}
