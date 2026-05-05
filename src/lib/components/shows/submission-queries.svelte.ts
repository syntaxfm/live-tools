import { QuerySubscription } from 'jazz-tools/svelte';

import { app } from '$lib/schema';
import type { AudienceSubmission, SubmissionVote } from '$lib/schema';

export function createShowApprovedSubmissionsSubscription(
	showId: () => string | undefined
): QuerySubscription<AudienceSubmission> {
	return new QuerySubscription(
		() => {
			const id = showId();
			return id ? app.audienceSubmissions.where({ showId: id, status: 'approved' }) : undefined;
		},
		{ tier: 'global' }
	);
}

export function createShowSubmissionVotesSubscription(
	showId: () => string | undefined
): QuerySubscription<SubmissionVote> {
	return new QuerySubscription(
		() => {
			const id = showId();

			return id ? app.submissionVotes.where({ showId: id }) : undefined;
		},
		{ tier: 'global' }
	);
}

export function createOwnShowSubmissionVotesSubscription(
	showId: () => string | undefined,
	voterId: () => string | undefined
): QuerySubscription<SubmissionVote> {
	return new QuerySubscription(
		() => {
			const id = showId();
			const currentVoterId = voterId();

			return id && currentVoterId
				? app.submissionVotes.where({ showId: id, voterId: currentVoterId })
				: undefined;
		},
		{ tier: 'global' }
	);
}

export function createOwnShowSubmissionSubscription(
	showId: () => string | undefined,
	authorId: () => string | undefined
): QuerySubscription<AudienceSubmission> {
	return new QuerySubscription(
		() => {
			const id = showId();
			const currentAuthorId = authorId();

			return id && currentAuthorId
				? app.audienceSubmissions.where({ showId: id, authorId: currentAuthorId })
				: undefined;
		},
		{ tier: 'global' }
	);
}

export function createAudienceSubmissionSubscription(
	submissionId: () => string | undefined
): QuerySubscription<AudienceSubmission> {
	return new QuerySubscription(
		() => {
			const id = submissionId();

			return id ? app.audienceSubmissions.where({ id }) : undefined;
		},
		{ tier: 'global' }
	);
}
