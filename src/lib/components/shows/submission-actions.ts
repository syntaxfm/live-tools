import type { Db } from 'jazz-tools';

import { app } from '$lib/schema';
import type {
	AppUser,
	AudienceSubmission,
	AudienceSubmissionInsert,
	FeaturedSubmissionOverlay,
	FeaturedSubmissionOverlayInsert,
	SubmissionVote,
	SubmissionVoteInsert,
	Show
} from '$lib/schema';
import { canEditAudienceSubmission } from '$lib/utils/submissions';
import type { AudienceSubmissionKind, AudienceSubmissionStatus } from '$lib/utils/submissions';

const DEV_LOCAL_FIRST_DISPLAY_NAME = 'Local anonymous';
const DEFAULT_AUDIENCE_SUBMISSION_KIND: AudienceSubmissionKind = 'tool';

interface AudienceSubmissionFields {
	kind: AudienceSubmissionKind;
	title: string;
	url: string;
}

interface SaveAudienceSubmissionOptions {
	appUser: AppUser | null;
	db: Db;
	existingSubmission: AudienceSubmission | null;
	externalUserId: string;
	isDevLocalFirst: boolean;
	show: Show;
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
	appUserId: string;
	db: Db;
	existingOverlay: FeaturedSubmissionOverlay | null;
	isAdmin: boolean;
	showId: string;
	submission: AudienceSubmission;
}

interface SetAudienceSubmissionVoteOptions {
	appUser: AppUser | null;
	db: Db;
	existingVote: SubmissionVote | null;
	isUpvoted: boolean;
	showId: string;
	submission: AudienceSubmission;
}

interface ClearFeaturedSubmissionOptions {
	appUserId: string;
	db: Db;
	existingOverlay: FeaturedSubmissionOverlay | null;
	isAdmin: boolean;
	showId: string;
}

export async function saveAudienceSubmission({
	appUser,
	db,
	existingSubmission,
	externalUserId,
	isDevLocalFirst,
	show,
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

	const submissionAppUser = await getSubmissionAppUser({
		appUser,
		db,
		externalUserId,
		isDevLocalFirst
	});

	const fields: AudienceSubmissionFields = {
		kind: DEFAULT_AUDIENCE_SUBMISSION_KIND,
		title: trimmedUrl,
		url: trimmedUrl
	};

	const insert: AudienceSubmissionInsert = {
		...fields,
		authorId: submissionAppUser.id,
		createdAt: new Date(),
		isFeatured: false,
		showId: show.id,
		status: 'pending'
	};

	await db.insert(app.audienceSubmissions, insert).wait({ tier: 'global' });
}

async function getSubmissionAppUser({
	appUser,
	db,
	externalUserId,
	isDevLocalFirst
}: {
	appUser: AppUser | null;
	db: Db;
	externalUserId: string;
	isDevLocalFirst: boolean;
}): Promise<AppUser> {
	if (appUser) {
		return appUser;
	}

	if (!isDevLocalFirst) {
		throw new Error('App user profile required');
	}

	const existingAppUser = await db.one(app.appUsers.where({ id: externalUserId }), {
		tier: 'global'
	});

	if (existingAppUser) {
		return existingAppUser;
	}

	return db
		.insert(
			app.appUsers,
			{
				displayName: DEV_LOCAL_FIRST_DISPLAY_NAME,
				externalUserId,
				isBanned: false
			},
			{ id: externalUserId }
		)
		.wait({ tier: 'global' });
}

export async function moderateAudienceSubmission({
	appUserId,
	db,
	isAdmin,
	status,
	submissionId
}: ModerateAudienceSubmissionOptions): Promise<void> {
	assertAdmin(isAdmin);

	await db
		.update(app.audienceSubmissions, submissionId, {
			reviewedAt: new Date(),
			reviewedById: appUserId,
			status
		})
		.wait({ tier: 'global' });
}

export async function featureAudienceSubmission({
	appUserId,
	db,
	existingOverlay,
	isAdmin,
	showId,
	submission
}: FeatureAudienceSubmissionOptions): Promise<void> {
	assertAdmin(isAdmin);

	if (submission.status !== 'approved') {
		throw new Error('Only approved submissions can be featured');
	}

	const updatedAt = new Date();

	if (existingOverlay) {
		await unfeaturePreviousSubmission(db, existingOverlay, submission.id);

		await db
			.update(app.featuredSubmissionOverlays, existingOverlay.id, {
				activeSubmissionId: submission.id,
				updatedAt,
				updatedById: appUserId
			})
			.wait({ tier: 'global' });
	} else {
		const insert: FeaturedSubmissionOverlayInsert = {
			activeSubmissionId: submission.id,
			showId,
			updatedAt,
			updatedById: appUserId
		};

		await db.insert(app.featuredSubmissionOverlays, insert).wait({ tier: 'global' });
	}

	await db
		.update(app.audienceSubmissions, submission.id, {
			isFeatured: true
		})
		.wait({ tier: 'global' });
}

export async function setAudienceSubmissionVote({
	appUser,
	db,
	existingVote,
	isUpvoted,
	showId,
	submission
}: SetAudienceSubmissionVoteOptions): Promise<void> {
	if (!appUser) {
		throw new Error('App user profile required');
	}

	if (submission.showId !== showId) {
		throw new Error('Submission does not belong to show');
	}

	if (submission.status !== 'approved') {
		throw new Error('Only approved submissions can be voted on');
	}

	if (submission.authorId === appUser.id) {
		throw new Error('Cannot vote on your own submission');
	}

	const value = isUpvoted ? 1 : 0;

	if (existingVote) {
		await db
			.update(app.submissionVotes, existingVote.id, {
				value
			})
			.wait({ tier: 'global' });
		return;
	}

	const insert: SubmissionVoteInsert = {
		createdAt: new Date(),
		showId,
		submissionId: submission.id,
		value,
		voterId: appUser.id
	};

	await db.insert(app.submissionVotes, insert).wait({ tier: 'global' });
}

export async function clearFeaturedSubmission({
	appUserId,
	db,
	existingOverlay,
	isAdmin,
	showId
}: ClearFeaturedSubmissionOptions): Promise<void> {
	assertAdmin(isAdmin);

	if (!existingOverlay) {
		const insert: FeaturedSubmissionOverlayInsert = {
			activeSubmissionId: null,
			showId,
			updatedAt: new Date(),
			updatedById: appUserId
		};

		await db.insert(app.featuredSubmissionOverlays, insert).wait({ tier: 'global' });
		return;
	}

	await unfeaturePreviousSubmission(db, existingOverlay);

	await db
		.update(app.featuredSubmissionOverlays, existingOverlay.id, {
			activeSubmissionId: null,
			updatedAt: new Date(),
			updatedById: appUserId
		})
		.wait({ tier: 'global' });
}

async function unfeaturePreviousSubmission(
	db: Db,
	existingOverlay: FeaturedSubmissionOverlay,
	nextSubmissionId?: string
): Promise<void> {
	const previousSubmissionId = existingOverlay.activeSubmissionId;

	if (!previousSubmissionId || previousSubmissionId === nextSubmissionId) {
		return;
	}

	await db
		.update(app.audienceSubmissions, previousSubmissionId, {
			isFeatured: false
		})
		.wait({ tier: 'global' });
}

function assertAdmin(isAdmin: boolean): void {
	if (!isAdmin) {
		throw new Error('Admin access required');
	}
}
