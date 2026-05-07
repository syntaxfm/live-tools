import type { Db } from 'jazz-tools';

import { resolve } from '$app/paths';
import { app } from '$lib/schema';
import type { AudienceSubmission, AudienceSubmissionInsert, Show } from '$lib/schema';
import { canEditAudienceSubmission } from '$lib/utils/submissions';
import type { AudienceSubmissionKind, AudienceSubmissionStatus } from '$lib/utils/submissions';

const DEFAULT_AUDIENCE_SUBMISSION_KIND: AudienceSubmissionKind = 'tool';

interface AudienceSubmissionFields {
	kind: AudienceSubmissionKind;
	title: string;
	url: string;
}

interface SaveAudienceSubmissionOptions {
	db: Db;
	existingSubmission: AudienceSubmission | null;
	externalUserId: string;
	show: Show;
	title: string | undefined;
	url: string;
}

interface ModerateAudienceSubmissionOptions {
	appUserId: string;
	db: Db;
	isAdmin: boolean;
	status: AudienceSubmissionStatus;
	submissionId: string;
}

interface FeatureAudienceSubmissionOptions {
	db: Db;
	isAdmin: boolean;
	showId: string;
	submission: AudienceSubmission;
}

interface SetAudienceSubmissionVoteOptions {
	appUserId: string | null;
	isUpvoted: boolean;
	showId: string;
	submission: AudienceSubmission;
}

interface ClearFeaturedSubmissionOptions {
	db: Db;
	isAdmin: boolean;
	showId: string;
}

export async function saveAudienceSubmission({
	existingSubmission,
	db,
	externalUserId,
	show,
	title,
	url
}: SaveAudienceSubmissionOptions): Promise<void> {
	if (!canEditAudienceSubmission(show)) {
		throw new Error('Audience submissions are closed');
	}

	if (existingSubmission) {
		throw new Error('Submission already exists');
	}

	const trimmedUrl = url.trim();

	if (!trimmedUrl) {
		throw new TypeError('Submission URL required');
	}

	const trimmedTitle = title?.trim() || trimmedUrl;

	const fields: AudienceSubmissionFields = {
		kind: DEFAULT_AUDIENCE_SUBMISSION_KIND,
		title: trimmedTitle,
		url: trimmedUrl
	};

	const insert: AudienceSubmissionInsert = {
		...fields,
		authorId: externalUserId,
		createdAt: new Date(),
		isFeatured: false,
		showId: show.id,
		status: 'pending'
	};

	await db.insert(app.audienceSubmissions, insert).wait({ tier: 'global' });
}

export async function moderateAudienceSubmission({
	appUserId,
	db,
	isAdmin,
	status,
	submissionId
}: ModerateAudienceSubmissionOptions): Promise<void> {
	assertAdmin(isAdmin);

	const updates: Partial<AudienceSubmissionInsert> =
		status === 'approved'
			? {
					reviewedAt: new Date(),
					reviewedById: appUserId,
					status
				}
			: {
					isFeatured: false,
					reviewedAt: new Date(),
					reviewedById: appUserId,
					status
				};

	await db.update(app.audienceSubmissions, submissionId, updates).wait({ tier: 'global' });
}

export async function featureAudienceSubmission({
	db,
	isAdmin,
	showId,
	submission
}: FeatureAudienceSubmissionOptions): Promise<void> {
	assertAdmin(isAdmin);

	if (submission.status !== 'approved') {
		throw new Error('Only approved submissions can be featured');
	}

	if (submission.showId !== showId) {
		throw new Error('Submission does not belong to show');
	}

	await unfeatureShowSubmissions(db, showId, submission.id);

	await db
		.update(app.audienceSubmissions, submission.id, {
			isFeatured: true
		})
		.wait({ tier: 'global' });
}

export async function setAudienceSubmissionVote({
	appUserId,
	isUpvoted,
	showId,
	submission
}: SetAudienceSubmissionVoteOptions): Promise<void> {
	if (!appUserId) {
		throw new Error('App user profile required');
	}

	if (submission.showId !== showId) {
		throw new Error('Submission does not belong to show');
	}

	if (submission.status !== 'approved') {
		throw new Error('Only approved submissions can be voted on');
	}

	if (submission.authorId === appUserId) {
		throw new Error('Cannot vote on your own submission');
	}

	const response = await fetch(resolve('/api/submission-votes'), {
		body: JSON.stringify({
			isUpvoted,
			showId,
			submissionId: submission.id
		}),
		headers: {
			'content-type': 'application/json'
		},
		method: 'POST'
	});

	if (!response.ok) {
		throw new Error('Unable to vote');
	}
}

export async function clearFeaturedSubmission({
	db,
	isAdmin,
	showId
}: ClearFeaturedSubmissionOptions): Promise<void> {
	assertAdmin(isAdmin);

	await unfeatureShowSubmissions(db, showId);
}

async function unfeatureShowSubmissions(
	db: Db,
	showId: string,
	nextSubmissionId?: string
): Promise<void> {
	const submissions = await db.all(app.audienceSubmissions.where({ showId }), { tier: 'global' });

	await Promise.all(
		submissions
			.filter((submission) => submission.isFeatured && submission.id !== nextSubmissionId)
			.map((submission) =>
				db
					.update(app.audienceSubmissions, submission.id, {
						isFeatured: false
					})
					.wait({ tier: 'global' })
			)
	);
}

function assertAdmin(isAdmin: boolean): void {
	if (!isAdmin) {
		throw new Error('Admin access required');
	}
}
