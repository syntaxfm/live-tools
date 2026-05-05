<script lang="ts">
	import { createCurrentAppUserSubscription } from '$lib/components/auth/current-app-user.svelte';
	import { setAudienceSubmissionVote } from '$lib/components/shows/submission-actions';
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

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const appUsers = createCurrentAppUserSubscription();
	const submissions = createShowApprovedSubmissionsSubscription(() => showId);
	const votes = createShowSubmissionVotesSubscription(() => showId);
	const appUser = $derived(appUsers.current?.[0] ?? null);
	const ownVotes = createOwnShowSubmissionVotesSubscription(
		() => showId,
		() => appUser?.id
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
			!appUser ||
			submission.authorId === appUser.id ||
			pendingVoteSubmissionId === submission.id
		) {
			return;
		}

		const existingVote = ownVotesBySubmissionId.get(submission.id) ?? null;

		pendingVoteSubmissionId = submission.id;
		error = null;
		console.log('Submitting vote', {
			existingVote,
			isUpvoted: !existingVote || existingVote.value <= 0,
			showId,
			submission
		});

		try {
			await setAudienceSubmissionVote({
				appUser,
				isUpvoted: !existingVote || existingVote.value <= 0,
				showId,
				submission
			});
		} catch (caughtError) {
			console.error('Unable to vote on audience submission', caughtError);
			error = 'Unable to vote';
		} finally {
			pendingVoteSubmissionId = null;
		}
	}
</script>

<section class="surface" data-depth="medium">
	{#if submissions.loading || votes.loading || appUsers.loading}
		<p class="status" data-state="connecting">Loading</p>
	{:else if submissions.error || votes.error || ownVotes.error}
		<p class="status" data-state="warning">
			{(submissions.error ?? votes.error ?? ownVotes.error)?.message}
		</p>
	{:else if approvedSubmissions.length}
		<ul class="submission-list">
			{#each approvedSubmissions as submission (submission.id)}
				{@const voteCount = voteCounts.get(submission.id) ?? 0}
				{@const ownVote = ownVotesBySubmissionId.get(submission.id)}
				{@const isUpvoted = Boolean(ownVote && ownVote.value > 0)}
				{@const canVote = Boolean(appUser && submission.authorId !== appUser.id)}
				<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={submission.url} rel="noreferrer" target="_blank"
						>{getAudienceSubmissionTitle(submission)}</a
					>
					<p class="inline-actions">
						{#if canVote}
							<button
								aria-pressed={isUpvoted}
								data-variant={isUpvoted ? 'primary' : undefined}
								disabled={pendingVoteSubmissionId === submission.id}
								type="button"
								onclick={() => handleVote(submission)}
							>
								{isUpvoted ? 'Upvoted' : 'Upvote'}
							</button>
						{/if}
						<span class="badge" aria-label={`${voteCount} votes`}>{voteCount}</span>
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
