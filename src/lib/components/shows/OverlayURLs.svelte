<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { OVERLAY_FEATURES } from '$lib/utils/overlays';
	import { getAbsoluteUrl } from '$lib/utils/urls';
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Overlays</p>
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

<style>
	ul {
		list-style: none;
		padding-left: 0;
	}
</style>
