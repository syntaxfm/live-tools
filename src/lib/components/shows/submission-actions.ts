import type { Db } from 'jazz-tools';
import { app } from '$lib/schema';
import type { AudienceSubmission, AudienceSubmissionInsert, Show } from '$lib/schema';
import { canEditAudienceSubmission } from '$lib/utils/submissions';
import type { AudienceSubmissionKind } from '$lib/utils/submissions';

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

interface FeatureAudienceSubmissionOptions {
	db: Db;
	is_admin: boolean;
	showId: string;
	submission: AudienceSubmission;
}

interface ClearFeaturedSubmissionOptions {
	db: Db;
	is_admin: boolean;
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

export async function featureAudienceSubmission({
	db,
	is_admin,
	showId,
	submission
}: FeatureAudienceSubmissionOptions): Promise<void> {
	assertAdmin(is_admin);

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

export async function clearFeaturedSubmission({
	db,
	is_admin,
	showId
}: ClearFeaturedSubmissionOptions): Promise<void> {
	assertAdmin(is_admin);

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

function assertAdmin(is_admin: boolean): void {
	if (!is_admin) {
		throw new Error('Admin access required');
	}
}
