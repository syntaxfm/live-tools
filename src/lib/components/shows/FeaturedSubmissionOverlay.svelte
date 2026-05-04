<script lang="ts">
	import {
		createAudienceSubmissionSubscription,
		createFeaturedSubmissionOverlaySubscription
	} from '$lib/components/shows/submission-queries.svelte';
	import { getAudienceSubmissionTitle } from '$lib/utils/submissions';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const featuredOverlays = createFeaturedSubmissionOverlaySubscription(() => showId);
	const featuredOverlay = $derived(featuredOverlays.current?.[0] ?? null);
	const submissions = createAudienceSubmissionSubscription(
		() => featuredOverlay?.activeSubmissionId ?? undefined
	);
	const submission = $derived(submissions.current?.[0] ?? null);
</script>

{#if submission?.status === 'approved'}
	<section class="overlay-readout overlay-readout--submission">
		<p>Submission</p>
		<h1>{getAudienceSubmissionTitle(submission)}</h1>
		{#if submission.notes}
			<h2>{submission.notes}</h2>
		{/if}
	</section>
{/if}
