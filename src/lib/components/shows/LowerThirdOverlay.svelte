<script lang="ts">
	import {
		createLowerThirdOverlaySubscription,
		createShowHostSubscription
	} from '$lib/components/shows/show-queries.svelte';
	import {
		getCurrentLowerThirdOverlay,
		getLowerThirdAsset,
		getLowerThirdTitle,
		isLowerThirdBroadcastActive
	} from '$lib/utils/lower-thirds';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const lowerThirdOverlays = createLowerThirdOverlaySubscription(() => showId);
	const lowerThirdOverlay = $derived(getCurrentLowerThirdOverlay(lowerThirdOverlays.current ?? []));
	const activeShowHostId = $derived(lowerThirdOverlay?.activeShowHostId ?? undefined);
	const hosts = createShowHostSubscription(() => activeShowHostId);
	const host = $derived(hosts.current?.[0] ?? null);
	const asset = $derived(host ? getLowerThirdAsset(host) : null);
	const title = $derived(host ? getLowerThirdTitle(host) : '');
	const updatedAt = $derived(
		lowerThirdOverlay ? new Date(lowerThirdOverlay.updatedAt).getTime() : 0
	);
	const shouldShowLowerThird = $derived(
		lowerThirdOverlay ? isLowerThirdBroadcastActive(new Date(lowerThirdOverlay.updatedAt)) : false
	);
</script>

{#if host && asset && lowerThirdOverlay?.activeShowHostId && shouldShowLowerThird}
	<div class="lower-third-stage">
		{#key `${host.id}-${updatedAt}`}
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
