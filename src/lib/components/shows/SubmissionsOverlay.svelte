<script lang="ts">
	import { tick } from 'svelte';

	import {
		createShowApprovedSubmissionsSubscription,
		createShowSubmissionVotesSubscription
	} from '$lib/components/shows/submission-queries.svelte';
	import {
		getAudienceSubmissionTitle,
		getTopVotedAudienceSubmissions,
		type RankedAudienceSubmission
	} from '$lib/utils/submissions';
	import { getViewTransitionName, updateWithViewTransition } from '$lib/utils/view-transitions';

	const SUBMISSIONS_OVERLAY_LIMIT = 4;

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const submissions = createShowApprovedSubmissionsSubscription(() => showId);
	const votes = createShowSubmissionVotesSubscription(() => showId);
	const rankedSubmissions = $derived(
		getTopVotedAudienceSubmissions(
			submissions.current ?? [],
			votes.current ?? [],
			SUBMISSIONS_OVERLAY_LIMIT
		)
	);
	const rankedSubmissionsSignature = $derived(
		rankedSubmissions
			.map(({ submission, voteCount }) =>
				[
					submission.id,
					voteCount,
					submission.title ?? '',
					submission.url,
					submission.notes ?? '',
					submission.updatedAt ?? ''
				].join(':')
			)
			.join('|')
	);

	let displayedSubmissions = $state<RankedAudienceSubmission[]>([]);
	let displayedSubmissionsSignature = $state('');

	$effect(() => {
		const nextSubmissions = rankedSubmissions;
		const nextSignature = rankedSubmissionsSignature;

		if (nextSignature === displayedSubmissionsSignature) {
			return;
		}

		updateWithViewTransition(async () => {
			displayedSubmissions = nextSubmissions;
			displayedSubmissionsSignature = nextSignature;
			await tick();
		}).catch((caughtError: unknown) => {
			console.error('Unable to transition submissions overlay', caughtError);
			displayedSubmissions = nextSubmissions;
			displayedSubmissionsSignature = nextSignature;
		});
	});
</script>

{#if displayedSubmissions.length > 0}
	<section class="submissions-overlay" aria-label="Submissions">
		<p>Submissions</p>

		<ol class="submissions-overlay__list">
			{#each displayedSubmissions as { submission, voteCount }, index (submission.id)}
				<li
					class="submissions-overlay__item"
					style={`view-transition-name: ${getViewTransitionName('submission', submission.id)}`}
				>
					<span class="submissions-overlay__rank">{index + 1}</span>
					<h1>{getAudienceSubmissionTitle(submission)}</h1>
					<span class="submissions-overlay__votes" aria-label={`${voteCount} votes`}
						>{voteCount}</span
					>
				</li>
			{/each}
		</ol>
	</section>
{/if}
