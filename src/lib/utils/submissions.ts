import type { AudienceSubmission } from '$lib/schema';

export type AudienceSubmissionStatus = AudienceSubmission['status'];

export const AUDIENCE_SUBMISSION_STATUSES: readonly AudienceSubmissionStatus[] = [
	'pending',
	'approved',
	'rejected'
];

export function compareAudienceSubmissionsByNewest(
	first: AudienceSubmission,
	second: AudienceSubmission
): number {
	return getSubmissionTime(second) - getSubmissionTime(first) || second.id.localeCompare(first.id);
}

function getSubmissionTime(submission: AudienceSubmission): number {
	return new Date(submission.updatedAt ?? submission.createdAt).getTime();
}
