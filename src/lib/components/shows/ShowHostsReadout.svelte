<script lang="ts">
	import { createShowHostsSubscription } from '$lib/components/shows/show-queries.svelte';
	import { compareShowHostsByPosition } from '$lib/utils/shows';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const hosts = createShowHostsSubscription(() => showId);
	const sortedHosts = $derived([...(hosts.current ?? [])].sort(compareShowHostsByPosition));
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Hosts</p>

	{#if hosts.loading}
		<h2>Loading</h2>
	{:else if hosts.error}
		<h2>{hosts.error.message}</h2>
	{:else if sortedHosts.length}
		<ul>
			{#each sortedHosts as host (host.id)}
				<li>
					<span>{host.displayName}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<h2>No hosts</h2>
	{/if}
</section>
