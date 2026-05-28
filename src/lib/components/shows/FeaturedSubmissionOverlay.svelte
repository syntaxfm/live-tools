<script lang="ts">
	import type { SubmissionView } from '$lib/components/shows/room-protocol';

	let { featured }: { featured: SubmissionView | null } = $props();
</script>

{#if featured}
	<section class="overlay-readout overlay-readout--submission">
		<h1>{featured.title || featured.url}</h1>
		{#if featured.notes}
			<h2>{featured.notes}</h2>
		{/if}
	</section>
{/if}
