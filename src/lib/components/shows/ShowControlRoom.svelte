<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getJazzContext } from 'jazz-tools/svelte';

	import AdminSubmissionQueue from '$lib/components/shows/AdminSubmissionQueue.svelte';
	import LowerThirdControls from '$lib/components/shows/LowerThirdControls.svelte';
	import ShowHostsReadout from '$lib/components/shows/ShowHostsReadout.svelte';
	import ShowReadout from '$lib/components/shows/ShowReadout.svelte';
	import ShowStatePanel from '$lib/components/shows/ShowStatePanel.svelte';
	import { OVERLAY_FEATURES } from '$lib/utils/overlays';
	import { getAbsoluteUrl } from '$lib/utils/urls';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const jazzContext = getJazzContext();
	const isAdmin = $derived(jazzContext.session?.claims.isAdmin === true);
</script>

{#if isAdmin}
	<ShowReadout label="Admin" {showId} surface="admin" />
	<ShowStatePanel {showId} />
	<ShowHostsReadout {showId} />
	<LowerThirdControls {showId} />
	<AdminSubmissionQueue {showId} />

	<section class="surface" data-depth="medium">
		<p class="section-label">OBS</p>
		<h2>Overlay URLs</h2>

		<ul>
			{#each OVERLAY_FEATURES as overlay (overlay.feature)}
				<li>
					<label>
						{overlay.label}
						<input readonly value={getAbsoluteUrl(resolve(overlay.path), page.url.origin)} />
					</label>
				</li>
			{/each}
		</ul>
	</section>
{:else}
	<section class="surface" data-depth="medium">
		<p class="section-label">Admin</p>
		<h1>Admin access required</h1>
	</section>
{/if}
