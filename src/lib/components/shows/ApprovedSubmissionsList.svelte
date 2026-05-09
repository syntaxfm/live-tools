<script lang="ts">
	import { type AudienceSubmission, type Show, type SubmissionVote } from '$lib/schema';
	import { getSession } from 'jazz-tools/svelte';
	import { flip } from 'svelte/animate';

	let {
		show
	}: {
		show: Show & {
			audienceSubmissionsViaShow: (AudienceSubmission & {
				submissionVotesViaSubmission: SubmissionVote[];
			})[];
		};
	} = $props();

	const session = getSession();
	let pendingVoteSubmissionId = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function handleVote(submission: AudienceSubmission): Promise<void> {
		if (
			!session?.user_id ||
			submission.authorId === session.user_id ||
			pendingVoteSubmissionId === submission.id
		) {
			return;
		}
		// TODO handle voting

		pendingVoteSubmissionId = submission.id;
		error = null;

		try {
			// TODO Vote
		} catch (caughtError) {
			console.error('Unable to vote on audience submission', caughtError);
			error = 'Unable to vote';
		} finally {
			pendingVoteSubmissionId = null;
		}
	}
</script>

{#if show.audienceSubmissionsViaShow}
	<ul class="submission-list">
		{#each show.audienceSubmissionsViaShow as submission (submission.id)}
			{@const canVote = Boolean(session?.user_id && submission.authorId !== session.user_id)}
			{@const vote_count = submission.submissionVotesViaSubmission.length}
			{@const user_voted = submission.submissionVotesViaSubmission.find(
				(vote) => vote.voterId === session?.user_id
			)}
			<li animate:flip>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="submission-link" href={submission.url} rel="noreferrer" target="_blank"
					>{submission.title || submission.url}</a
				>
				<p class="inline-actions">
					{#if canVote}
						<button
							data-variant={user_voted ? 'primary' : undefined}
							disabled={pendingVoteSubmissionId === submission.id}
							type="button"
							onclick={() => handleVote(submission)}
						>
							<span aria-label={`${vote_count} votes`}>{vote_count}</span>
							{user_voted ? 'Upvoted' : 'Upvote'}
						</button>
					{/if}
				</p>
			</li>
		{/each}
	</ul>
{:else}
	<h3>Submissions incoming...</h3>
{/if}

{#if error}
	<p class="status" data-state="warning">{error}</p>
{/if}

<style>
	.submission-list {
		display: grid;
		margin: 0;
		padding: 0;
		gap: 0.875rem;
		list-style: none;
	}

	.submission-list > li {
		gap: 0.625rem;
		border-bottom: 1px solid var(--color-border-subtle);
	}

	.submission-list > li:last-child {
		border-bottom: 0;
	}

	li {
		display: flex;
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-raised-md);
		padding: 0.625rem 0.75rem;
		align-items: center;
		justify-content: space-between;
	}

	a {
		text-decoration: none;
		color: white;
	}

	.inline-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
