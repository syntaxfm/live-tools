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
	import { QuerySubscription } from 'jazz-tools/svelte';
	import { app } from '$lib/schema';

	const SUBMISSIONS_OVERLAY_LIMIT = 4;

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const submissions = new QuerySubscription(
		() => (showId ? app.audienceSubmissions.where({ showId, status: 'approved' }) : undefined),
		{ tier: 'global' }
	);
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

<style>
	.submissions-overlay {
		position: absolute;
		right: 64px;
		bottom: 64px;
		display: grid;
		width: min(720px, calc(100% - 128px));
		gap: 16px;
		animation: submissions-overlay-in 240ms cubic-bezier(0.2, 0, 0, 1) both;
		view-transition-name: submissions-overlay;
	}

	.submissions-overlay > p {
		color: var(--color-accent);
		font-family: var(--font-label);
		font-size: 24px;
		font-weight: 700;
		letter-spacing: 0;
		text-align: right;
		text-transform: uppercase;
	}

	.submissions-overlay__list {
		display: grid;
		margin: 0;
		padding: 0;
		gap: 12px;
		list-style: none;
	}

	.submissions-overlay__item {
		display: grid;
		grid-template-columns: 56px minmax(0, 1fr) max-content;
		align-items: center;
		gap: 20px;
		min-height: 108px;
		padding: 18px 22px;
		border: var(--border-width) solid var(--color-black);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-raised-md);
		contain: layout;
	}

	.submissions-overlay__rank,
	.submissions-overlay__votes {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-label);
		font-weight: 700;
		letter-spacing: 0;
	}

	.submissions-overlay__rank {
		width: 56px;
		height: 56px;
		border: var(--border-width) solid var(--color-ink);
		border-radius: var(--radius-md);
		background: var(--color-accent);
		color: var(--color-ink);
		font-size: 28px;
	}

	.submissions-overlay__item > h1 {
		overflow: hidden;
		color: var(--color-text);
		font-size: 34px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.submissions-overlay__votes {
		min-width: 72px;
		color: var(--color-accent);
		font-size: 42px;
	}

	:global(::view-transition-group(submissions-overlay)) {
		animation-duration: 320ms;
		animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
	}

	:global(::view-transition-old(submissions-overlay)),
	:global(::view-transition-new(submissions-overlay)) {
		animation-timing-function: cubic-bezier(0.2, 0, 0, 1);
	}

	@keyframes submissions-overlay-in {
		from {
			opacity: 0;
			translate: 24px 18px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.submissions-overlay,
		.submissions-overlay__item {
			view-transition-name: none !important;
		}
	}
</style>
