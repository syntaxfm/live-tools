<script lang="ts">
	import {
		createOwnShowSubmissionVotesSubscription,
		createShowApprovedSubmissionsSubscription,
		createShowSubmissionVotesSubscription
	} from '$lib/components/shows/submission-queries.svelte';
	import type { AudienceSubmission } from '$lib/schema';
	import {
		compareAudienceSubmissionsByNewest,
		getAudienceSubmissionTitle,
		getSubmissionVoteCounts,
		getSubmissionVotesBySubmissionId
	} from '$lib/utils/submissions';
	import { getSession } from 'jazz-tools/svelte';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const session = getSession();
	const submissions = createShowApprovedSubmissionsSubscription(() => showId);
	const votes = createShowSubmissionVotesSubscription(() => showId);
	const ownVotes = createOwnShowSubmissionVotesSubscription(
		() => showId,
		() => session?.user_id
	);
	const approvedSubmissions = $derived(
		[...(submissions.current ?? [])].sort(compareAudienceSubmissionsByNewest)
	);
	const voteCounts = $derived(getSubmissionVoteCounts(votes.current ?? []));
	const ownVotesBySubmissionId = $derived(getSubmissionVotesBySubmissionId(ownVotes.current ?? []));

	let pendingVoteSubmissionId = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function handleVote(submission: AudienceSubmission): Promise<void> {
		if (
			!showId ||
			!session?.user_id ||
			submission.authorId === session.user_id ||
			pendingVoteSubmissionId === submission.id
		) {
			return;
		}

		const existingVote = ownVotesBySubmissionId.get(submission.id) ?? null;

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

<section class="surface" data-depth="medium">
	{#if submissions.error || votes.error || ownVotes.error}
		<p class="status" data-state="warning">
			{(submissions.error ?? votes.error ?? ownVotes.error)?.message}
		</p>
	{:else if approvedSubmissions.length}
		<ul class="submission-list">
			{#each approvedSubmissions as submission (submission.id)}
				{@const voteCount = voteCounts.get(submission.id) ?? 0}
				{@const ownVote = ownVotesBySubmissionId.get(submission.id)}
				{@const canVote = Boolean(session?.user_id && submission.authorId !== session.user_id)}
				<li>
					<span class="badge" aria-label={`${voteCount} votes`}>{voteCount}</span>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="submission-link" href={submission.url} rel="noreferrer" target="_blank"
						>{getAudienceSubmissionTitle(submission)}</a
					>
					<p class="inline-actions">
						{#if canVote}
							<button
								data-variant={ownVote ? 'primary' : undefined}
								disabled={pendingVoteSubmissionId === submission.id}
								type="button"
								onclick={() => handleVote(submission)}
							>
								{ownVote ? 'Upvoted' : 'Upvote'}
							</button>
						{/if}
					</p>
				</li>
			{/each}
		</ul>
	{:else}
		<h3>No approved submissions</h3>
	{/if}

	{#if error}
		<p class="status" data-state="warning">{error}</p>
	{/if}
</section>

<style>
	li {
		display: flex;
	}

	.inline-actions {
		margin-left: auto;
	}
</style>
