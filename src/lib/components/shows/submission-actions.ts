import type { Db } from 'jazz-tools';
import { app } from '$lib/schema';
import type { AudienceSubmission } from '$lib/schema';

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
