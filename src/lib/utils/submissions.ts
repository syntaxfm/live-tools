import type { SubmissionStatus } from '$lib/components/shows/room-protocol';

export const AUDIENCE_SUBMISSION_STATUSES: readonly SubmissionStatus[] = [
	'pending',
	'approved',
	'rejected'
];
