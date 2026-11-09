<script lang="ts">
	import { resolve } from '$app/paths';
	import { OVERLAY_PATH } from '$lib/utils/overlays';
	import { getAbsoluteUrl } from '$lib/utils/urls';
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Overlay</p>
	<label>
		OBS browser source
		<input readonly value={getAbsoluteUrl(resolve(OVERLAY_PATH), location.origin)} />
	</label>
</section>
