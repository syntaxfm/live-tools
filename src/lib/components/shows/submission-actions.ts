import type { Db } from 'jazz-tools';
import { app } from '$lib/schema';
import type { AudienceSubmission } from '$lib/schema';

interface FeatureAudienceSubmissionOptions {
	db: Db;
	showId: string;
	submission: AudienceSubmission;
}

interface ClearFeaturedSubmissionOptions {
	db: Db;
	showId: string;
}

export async function featureAudienceSubmission({
	db,
	showId,
	submission
}: FeatureAudienceSubmissionOptions): Promise<void> {
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
	showId
}: ClearFeaturedSubmissionOptions): Promise<void> {
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
