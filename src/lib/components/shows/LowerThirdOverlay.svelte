<script lang="ts">
	import { app } from '$lib/schema';
	import { getLowerThirdAsset, getLowerThirdTitle } from '$lib/utils/lower-thirds';
	import { QuerySubscription } from 'jazz-tools/svelte';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const shows = new QuerySubscription(() => (showId ? app.shows.where({ id: showId }) : undefined));
	const show = $derived(shows.current?.[0] ?? null);

	const activeShowHostId = $derived(show?.activeLowerThirdShowHostId ?? undefined);

	const hosts = new QuerySubscription(() =>
		activeShowHostId ? app.showHosts.where({ id: activeShowHostId }) : undefined
	);

	const host = $derived(hosts.current?.[0] ?? null);
	const asset = $derived(host ? getLowerThirdAsset(host) : null);
	const title = $derived(host ? getLowerThirdTitle(host) : '');
</script>

{#if host && asset && activeShowHostId}
	<div class="lower-third-stage">
		{#key host.id}
			<section class="lt-root" data-tone={asset.tone} aria-live="polite">
				<div class="lt-avatar">
					<img src={asset.src} alt="" />
				</div>

				<div class="lt-card">
					<h1 class="lt-display-name">{host.displayName}</h1>
					<p class="lt-byline">{title}</p>
				</div>
			</section>
		{/key}
	</div>
{/if}
