<script lang="ts">
	import { getJazzContext, QuerySubscription } from 'jazz-tools/svelte';

	import { createCurrentAppUserSubscription } from '$lib/components/auth/current-app-user.svelte';
	import HostShow from '$lib/components/shows/HostShow.svelte';
	import { getCurrentShow } from '$lib/utils/shows';
	import { app } from '$lib/schema';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';

	const appUsers = createCurrentAppUserSubscription();
	const shows = new QuerySubscription(app.shows.where({}), { tier: 'global' });
	const appUser = $derived(appUsers.current?.[0] ?? null);
	const currentShow = $derived(getCurrentShow(shows.current ?? []));
</script>

{#if appUser && currentShow}
	<ShowStatePanel showId={currentShow.id} />
	<HostShow showId={currentShow.id} />
{/if}
