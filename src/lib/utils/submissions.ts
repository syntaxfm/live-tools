import type { AudienceSubmission, Show, SubmissionVote } from '$lib/schema';
import { canUseAudienceSubmissionGate } from '$lib/utils/shows';

export type AudienceSubmissionKind = AudienceSubmission['kind'];
export type AudienceSubmissionStatus = AudienceSubmission['status'];

export const AUDIENCE_SUBMISSION_KINDS: readonly AudienceSubmissionKind[] = ['post', 'tool'];
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

export function getApprovedAudienceSubmissionsByKind(
	submissions: readonly AudienceSubmission[]
): ApprovedAudienceSubmissionsByKind {
	const approvedSubmissionsByKind: ApprovedAudienceSubmissionsByKind = {
		posts: [],
		tools: []
	};

	for (const submission of submissions) {
		if (submission.status !== 'approved') {
			continue;
		}

		if (submission.kind === 'post') {
			approvedSubmissionsByKind.posts.push(submission);
		} else {
			approvedSubmissionsByKind.tools.push(submission);
		}
	}

	approvedSubmissionsByKind.posts.sort(compareAudienceSubmissionsByNewest);
	approvedSubmissionsByKind.tools.sort(compareAudienceSubmissionsByNewest);

	return approvedSubmissionsByKind;
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
	const latestVotesBySubmissionId = new Map<string, Map<string, SubmissionVote>>();

	for (const vote of votes) {
		const submissionVotes =
			latestVotesBySubmissionId.get(vote.submissionId) ?? new Map<string, SubmissionVote>();
		const existingVote = submissionVotes.get(vote.voterId);

		if (!existingVote || getVoteTime(vote) > getVoteTime(existingVote)) {
			submissionVotes.set(vote.voterId, vote);
		}

		latestVotesBySubmissionId.set(vote.submissionId, submissionVotes);
	}

	for (const [submissionId, submissionVotes] of latestVotesBySubmissionId) {
		for (const vote of submissionVotes.values()) {
			voteCounts.set(submissionId, (voteCounts.get(submissionId) ?? 0) + vote.value);
		}
	}

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

export function isAudienceSubmissionKind(value: string): value is AudienceSubmissionKind {
	return AUDIENCE_SUBMISSION_KINDS.includes(value as AudienceSubmissionKind);
}

export function isAudienceSubmissionStatus(value: string): value is AudienceSubmissionStatus {
	return AUDIENCE_SUBMISSION_STATUSES.includes(value as AudienceSubmissionStatus);
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
