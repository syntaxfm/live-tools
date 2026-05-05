import type { Db } from 'jazz-tools';

import { app } from '$lib/schema';
import type { SubmissionVoteInsert } from '$lib/schema';

interface SetAudienceSubmissionVoteForUserOptions {
	db: Db;
	isUpvoted: boolean;
	showId: string;
	submissionId: string;
	userId: string;
}

export async function setAudienceSubmissionVoteForUser({
	db,
	isUpvoted,
	showId,
	submissionId,
	userId
}: SetAudienceSubmissionVoteForUserOptions): Promise<void> {
	const appUser = await db.one(app.appUsers.where({ externalUserId: userId }), {
		tier: 'global'
	});

	if (!appUser) {
		throw new Error('App user profile required');
	}

	if (appUser.isBanned) {
		throw new Error('Banned users cannot vote');
	}

	const [show, submission] = await Promise.all([
		db.one(app.shows.where({ id: showId }), { tier: 'global' }),
		db.one(app.audienceSubmissions.where({ id: submissionId }), { tier: 'global' })
	]);

	if (!show || (show.status !== 'live' && show.status !== 'ended')) {
		throw new Error('Show is not open for votes');
	}

	if (!submission || submission.showId !== showId || submission.status !== 'approved') {
		throw new Error('Submission is not open for votes');
	}

	if (submission.authorId === appUser.id) {
		throw new Error('Cannot vote on your own submission');
	}

	const value = isUpvoted ? 1 : 0;
	const existingVote = await db.one(
		app.submissionVotes.where({ submissionId, voterId: appUser.id }),
		{
			tier: 'global'
		}
	);

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
		submissionId,
		value,
		voterId: appUser.id
	};

	await db.insert(app.submissionVotes, insert).wait({ tier: 'global' });
}
