import type { AudienceSubmission, SubmissionVote } from '$lib/schema';

export type AudienceSubmissionKind = AudienceSubmission['kind'];
export type AudienceSubmissionStatus = AudienceSubmission['status'];

export const AUDIENCE_SUBMISSION_STATUSES: readonly AudienceSubmissionStatus[] = [
	'pending',
	'approved',
	'rejected'
];

export interface ApprovedAudienceSubmissionsByKind {
	posts: AudienceSubmission[];
	tools: AudienceSubmission[];
}

export function getLatestAudienceSubmission(
	submissions: readonly AudienceSubmission[]
): AudienceSubmission | null {
	return [...submissions].sort(compareAudienceSubmissionsByNewest)[0] ?? null;
}

export function getSubmissionVoteCounts(votes: readonly SubmissionVote[]): Map<string, number> {
	const voteCounts = new Map<string, number>();

	// TODO votes need to just show based on how many exist per submission
	return voteCounts;
}

export function compareAudienceSubmissionsByNewest(
	first: AudienceSubmission,
	second: AudienceSubmission
): number {
	return getSubmissionTime(second) - getSubmissionTime(first) || second.id.localeCompare(first.id);
}

function getSubmissionTime(submission: AudienceSubmission): number {
	return new Date(submission.updatedAt ?? submission.createdAt).getTime();
}
