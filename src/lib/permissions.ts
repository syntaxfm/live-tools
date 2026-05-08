import { schema as s } from 'jazz-tools';

import { app } from './schema';

type PermissionRefValue =
	| string
	| { readonly __jazzPermissionKind: 'row-ref'; readonly column: string };

export const permissions = s.definePermissions(
	app,
	({ policy, allOf, allowedTo, anyOf, session }) => {
		const is_external = session.where({ authMode: 'external' });
		const is_admin = allOf([is_external, session.where({ 'claims.isAdmin': true })]);
		const not_banned = (appUserId: PermissionRefValue) =>
			policy.appUsers.exists.where({
				id: appUserId,
				externalUserId: session.user_id,
				isBanned: false
			});
		const canReadShow = allowedTo.read('show');

		policy.better_auth_user.allowRead.never();
		policy.better_auth_user.allowInsert.never();
		policy.better_auth_user.allowUpdate.never();
		policy.better_auth_user.allowDelete.never();

		policy.better_auth_session.allowRead.never();
		policy.better_auth_session.allowInsert.never();
		policy.better_auth_session.allowUpdate.never();
		policy.better_auth_session.allowDelete.never();

		policy.better_auth_account.allowRead.never();
		policy.better_auth_account.allowInsert.never();
		policy.better_auth_account.allowUpdate.never();
		policy.better_auth_account.allowDelete.never();

		policy.better_auth_verification.allowRead.never();
		policy.better_auth_verification.allowInsert.never();
		policy.better_auth_verification.allowUpdate.never();
		policy.better_auth_verification.allowDelete.never();

		policy.better_auth_jwks.allowRead.never();
		policy.better_auth_jwks.allowInsert.never();
		policy.better_auth_jwks.allowUpdate.never();
		policy.better_auth_jwks.allowDelete.never();

		policy.appUsers.allowRead.where(allOf([is_external, { externalUserId: session.user_id }]));
		policy.appUsers.allowReads.where(is_admin);
		policy.appUsers.allowInsert.where(
			allOf([
				is_external,
				{
					externalUserId: session.user_id,
					isBanned: false
				}
			])
		);
		policy.appUsers.allowUpdate.where(is_admin);
		policy.appUsers.allowDelete.never();

		policy.shows.allowRead.where(anyOf([{ status: { in: ['live', 'ended'] } }, is_admin]));
		policy.shows.allowInsert.where(is_admin);
		policy.shows.allowUpdate.where(is_admin);
		policy.shows.allowDelete.where(is_admin);

		policy.showHosts.allowRead.where(anyOf([is_admin, canReadShow]));
		policy.showHosts.allowInsert.where(is_admin);
		policy.showHosts.allowUpdate.where(is_admin);
		policy.showHosts.allowDelete.where(is_admin);

		policy.hostLinks.allowRead.where(canReadShow);
		policy.hostLinks.allowInsert.where(is_admin);
		policy.hostLinks.allowUpdate.where(is_admin);
		policy.hostLinks.allowDelete.where(is_admin);

		policy.tickerMessages.allowRead.where(canReadShow);
		policy.tickerMessages.allowInsert.where(is_admin);
		policy.tickerMessages.allowUpdate.where(is_admin);
		policy.tickerMessages.allowDelete.where(is_admin);

		policy.audienceSubmissions.allowRead.where((submission) =>
			anyOf([
				is_admin,
				allOf([{ status: 'approved' }, canReadShow]),
				allOf([
					is_external,
					policy.appUsers.exists.where({
						id: submission.authorId,
						externalUserId: session.user_id
					})
				])
			])
		);
		policy.audienceSubmissions.allowInsert.where((submission) =>
			anyOf([
				is_admin,
				allOf([
					is_external,
					{ status: 'pending', isFeatured: false },
					not_banned(submission.authorId),
					policy.shows.exists.where({
						id: submission.showId,
						status: 'live',
						audienceSubmissionsOpen: true
					})
				]),
				allOf([is_external, { status: 'pending', isFeatured: false }])
			])
		);
		policy.audienceSubmissions.allowUpdate.where(is_admin);
		policy.audienceSubmissions.allowDelete.where(is_admin);

		policy.featuredSubmissionOverlays.allowRead.where(canReadShow);
		policy.featuredSubmissionOverlays.allowInsert.where(is_admin);
		policy.featuredSubmissionOverlays.allowUpdate.where(is_admin);
		policy.featuredSubmissionOverlays.allowDelete.where(is_admin);

		policy.submissionVotes.allowRead.where(canReadShow);
		policy.submissionVotes.allowInsert.never();
		policy.submissionVotes.allowUpdate.never();
		policy.submissionVotes.allowDelete.where(is_admin);

		policy.toolCandidates.allowRead.where(canReadShow);
		policy.toolCandidates.allowInsert.where(is_admin);
		policy.toolCandidates.allowUpdate.where(is_admin);
		policy.toolCandidates.allowDelete.where(is_admin);

		policy.toolPolls.allowRead.where(canReadShow);
		policy.toolPolls.allowInsert.where(is_admin);
		policy.toolPolls.allowUpdate.where(is_admin);
		policy.toolPolls.allowDelete.where(is_admin);

		policy.toolVotes.allowRead.where(is_admin);
		policy.toolVotes.allowInsert.where((vote) =>
			allOf([
				is_external,
				not_banned(vote.voterId),
				policy.toolPolls.exists.where({
					id: vote.pollId,
					showId: vote.showId,
					pollOpen: true
				}),
				policy.shows.exists.where({ id: vote.showId, status: 'live' })
			])
		);
		policy.toolVotes.allowUpdate.where((vote) =>
			allOf([
				is_external,
				not_banned(vote.voterId),
				policy.toolPolls.exists.where({
					id: vote.pollId,
					showId: vote.showId,
					pollOpen: true
				}),
				policy.shows.exists.where({ id: vote.showId, status: 'live' })
			])
		);
		policy.toolVotes.allowDelete.where(is_admin);

		policy.toolPollResults.allowRead.where(canReadShow);
		policy.toolPollResults.allowInsert.where(is_admin);
		policy.toolPollResults.allowUpdate.where(is_admin);
		policy.toolPollResults.allowDelete.where(is_admin);

		policy.feudQuestions.allowRead.where(canReadShow);
		policy.feudQuestions.allowInsert.where(is_admin);
		policy.feudQuestions.allowUpdate.where(is_admin);
		policy.feudQuestions.allowDelete.where(is_admin);

		policy.feudAnswers.allowRead.where(is_admin);
		policy.feudAnswers.allowInsert.where((answer) =>
			allOf([
				is_external,
				not_banned(answer.authorId),
				policy.shows.exists.where({ id: answer.showId, status: 'live' }),
				policy.feudQuestions.exists.where({
					id: answer.questionId,
					showId: answer.showId,
					collectionOpen: true
				})
			])
		);
		policy.feudAnswers.allowUpdate.where((answer) =>
			allOf([
				is_external,
				not_banned(answer.authorId),
				policy.shows.exists.where({ id: answer.showId, status: 'live' }),
				policy.feudQuestions.exists.where({
					id: answer.questionId,
					showId: answer.showId,
					collectionOpen: true
				})
			])
		);
		policy.feudAnswers.allowDelete.where(is_admin);

		policy.feudBuckets.allowRead.where(is_admin);
		policy.feudBuckets.allowInsert.where(is_admin);
		policy.feudBuckets.allowUpdate.where(is_admin);
		policy.feudBuckets.allowDelete.where(is_admin);

		policy.feudBoardSlots.allowRead.where(canReadShow);
		policy.feudBoardSlots.allowInsert.where(is_admin);
		policy.feudBoardSlots.allowUpdate.where(is_admin);
		policy.feudBoardSlots.allowDelete.where(is_admin);

		policy.feudStrikes.allowRead.where(canReadShow);
		policy.feudStrikes.allowInsert.where(is_admin);
		policy.feudStrikes.allowUpdate.where(is_admin);
		policy.feudStrikes.allowDelete.where(is_admin);
	}
);
