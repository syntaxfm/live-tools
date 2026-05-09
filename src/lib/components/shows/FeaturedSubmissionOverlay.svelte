<script lang="ts">
	import { app } from '$lib/schema';
	import { QuerySubscription } from 'jazz-tools/svelte';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const submissions = new QuerySubscription(
		() =>
			showId
				? app.audienceSubmissions.where({ showId, status: 'approved', isFeatured: true })
				: undefined,
		{ tier: 'global' }
	);
	const submission = $derived(submissions.current?.[0] ?? null);
</script>

{#if submission}
	<section class="overlay-readout overlay-readout--submission">
		<h1>{submission.title || submission.url}</h1>
		{#if submission?.notes}
			<h2>{submission?.notes}</h2>
		{/if}
	</section>
{/if}
