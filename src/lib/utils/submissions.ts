import type { AudienceSubmission, Show, SubmissionVote } from '$lib/schema';
import { canUseAudienceSubmissionGate } from '$lib/utils/shows';

export type AudienceSubmissionKind = AudienceSubmission['kind'];
export type AudienceSubmissionStatus = AudienceSubmission['status'];

const AUDIENCE_SUBMISSION_KINDS: readonly AudienceSubmissionKind[] = ['post', 'tool'];
export const AUDIENCE_SUBMISSION_STATUSES: readonly AudienceSubmissionStatus[] = [
	'pending',
	'approved',
	'rejected'
];

interface AudienceSubmissionGateShow {
	audienceSubmissionsOpen: Show['audienceSubmissionsOpen'];
	status: Show['status'];
}

export interface ApprovedAudienceSubmissionsByKind {
	posts: AudienceSubmission[];
	tools: AudienceSubmission[];
}

export interface RankedAudienceSubmission {
	submission: AudienceSubmission;
	voteCount: number;
}

export function canEditAudienceSubmission(show: AudienceSubmissionGateShow | null): boolean {
	return show ? canUseAudienceSubmissionGate(show) : false;
}

export function getAudienceSubmissionTitle(submission: AudienceSubmission): string {
	return submission.title?.trim() || submission.url;
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

export function getSubmissionVotesBySubmissionId(
	votes: readonly SubmissionVote[]
): Map<string, SubmissionVote> {
	const votesBySubmissionId = new Map<string, SubmissionVote>();

	for (const vote of votes) {
		const existingVote = votesBySubmissionId.get(vote.submissionId);

		if (!existingVote || getVoteTime(vote) > getVoteTime(existingVote)) {
			votesBySubmissionId.set(vote.submissionId, vote);
		}
	}

	return votesBySubmissionId;
}

export function getTopVotedAudienceSubmissions(
	submissions: readonly AudienceSubmission[],
	votes: readonly SubmissionVote[],
	limit: number
): RankedAudienceSubmission[] {
	if (limit < 1) {
		throw new TypeError('Submission limit must be greater than 0');
	}

	const voteCounts = getSubmissionVoteCounts(votes);

	return submissions
		.filter((submission) => submission.status === 'approved')
		.map((submission) => ({
			submission,
			voteCount: voteCounts.get(submission.id) ?? 0
		}))
		.sort(compareRankedAudienceSubmissions)
		.slice(0, limit);
}

export function compareAudienceSubmissionsByNewest(
	first: AudienceSubmission,
	second: AudienceSubmission
): number {
	return getSubmissionTime(second) - getSubmissionTime(first) || second.id.localeCompare(first.id);
}

function compareRankedAudienceSubmissions(
	first: RankedAudienceSubmission,
	second: RankedAudienceSubmission
): number {
	return (
		second.voteCount - first.voteCount ||
		compareAudienceSubmissionsByNewest(first.submission, second.submission)
	);
}

function getSubmissionTime(submission: AudienceSubmission): number {
	return new Date(submission.updatedAt ?? submission.createdAt).getTime();
}

function getVoteTime(vote: SubmissionVote): number {
	return new Date(vote.createdAt).getTime();
}
