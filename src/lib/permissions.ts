import { schema as s } from 'jazz-tools';

import { app } from './schema';

type PermissionRefValue =
	| string
	| { readonly __jazzPermissionKind: 'row-ref'; readonly column: string };

export const permissions = s.definePermissions(
	app,
	({ policy, allOf, allowedTo, anyOf, session }) => {
		const currentSessionIsExternal = session.where({ authMode: 'external' });
		const currentSessionIsDevLocalFirst = session.where({ authMode: 'local-first' });
		const currentSessionCanUseDevLocalFirst =
			process.env.POLE_ENABLE_DEV_LOCAL_FIRST_SUBMISSIONS === 'true'
				? currentSessionIsDevLocalFirst
				: session.where({
						authMode: 'local-first',
						'claims.__devLocalFirstSubmissions': true
					});
		const currentSessionCanOwnAppUser =
			process.env.POLE_ENABLE_DEV_LOCAL_FIRST_SUBMISSIONS === 'true'
				? anyOf([currentSessionIsExternal, currentSessionCanUseDevLocalFirst])
				: currentSessionIsExternal;
		const currentUserIsAdmin = allOf([
			currentSessionIsExternal,
			session.where({ 'claims.isAdmin': true })
		]);
		const currentUserIsNotBanned = (appUserId: PermissionRefValue) =>
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

		policy.appUsers.allowRead.where(
			allOf([currentSessionCanOwnAppUser, { externalUserId: session.user_id }])
		);
		policy.appUsers.allowReads.where(currentUserIsAdmin);
		policy.appUsers.allowInsert.where(
			allOf([
				currentSessionCanOwnAppUser,
				{
					externalUserId: session.user_id,
					isBanned: false
				}
			])
		);
		policy.appUsers.allowUpdate.where(currentUserIsAdmin);
		policy.appUsers.allowDelete.never();

		policy.shows.allowRead.where(
			anyOf([{ status: { in: ['live', 'ended'] } }, currentUserIsAdmin])
		);
		policy.shows.allowInsert.where(currentUserIsAdmin);
		policy.shows.allowUpdate.where(currentUserIsAdmin);
		policy.shows.allowDelete.never();

		policy.showHosts.allowRead.where(canReadShow);
		policy.showHosts.allowInsert.where(currentUserIsAdmin);
		policy.showHosts.allowUpdate.where(currentUserIsAdmin);
		policy.showHosts.allowDelete.never();

		policy.hostLinks.allowRead.where(canReadShow);
		policy.hostLinks.allowInsert.where(currentUserIsAdmin);
		policy.hostLinks.allowUpdate.where(currentUserIsAdmin);
		policy.hostLinks.allowDelete.never();

		policy.audienceSubmissions.allowRead.where((submission) =>
			anyOf([
				currentUserIsAdmin,
				allOf([{ status: 'approved' }, canReadShow]),
				allOf([
					currentSessionCanOwnAppUser,
					policy.appUsers.exists.where({
						id: submission.authorId,
						externalUserId: session.user_id
					})
				])
			])
		);
		policy.audienceSubmissions.allowInsert.where((submission) =>
			anyOf([
				currentUserIsAdmin,
				allOf([
					currentSessionCanOwnAppUser,
					{ status: 'pending', isFeatured: false },
					currentUserIsNotBanned(submission.authorId),
					policy.shows.exists.where({
						id: submission.showId,
						status: 'live',
						audienceSubmissionsOpen: true
					})
				]),
				allOf([currentSessionCanUseDevLocalFirst, { status: 'pending', isFeatured: false }])
			])
		);
		policy.audienceSubmissions.allowUpdate.where(currentUserIsAdmin);
		policy.audienceSubmissions.allowDelete.never();

		policy.featuredSubmissionOverlays.allowRead.where(canReadShow);
		policy.featuredSubmissionOverlays.allowInsert.where(currentUserIsAdmin);
		policy.featuredSubmissionOverlays.allowUpdate.where(currentUserIsAdmin);
		policy.featuredSubmissionOverlays.allowDelete.never();

		policy.lowerThirdOverlays.allowRead.where(canReadShow);
		policy.lowerThirdOverlays.allowInsert.where(currentUserIsAdmin);
		policy.lowerThirdOverlays.allowUpdate.where(currentUserIsAdmin);
		policy.lowerThirdOverlays.allowDelete.never();

		policy.submissionVotes.allowRead.where(canReadShow);
		policy.submissionVotes.allowInsert.where((vote) =>
			allOf([
				currentSessionIsExternal,
				{ value: { in: [0, 1] } },
				currentUserIsNotBanned(vote.voterId),
				policy.audienceSubmissions.exists.where({
					authorId: { ne: vote.voterId },
					id: vote.submissionId,
					showId: vote.showId,
					status: 'approved'
				}),
				policy.shows.exists.where({
					id: vote.showId,
					status: { in: ['live', 'ended'] }
				})
			])
		);
		policy.submissionVotes.allowUpdate.where((vote) =>
			allOf([
				currentSessionIsExternal,
				{ value: { in: [0, 1] } },
				currentUserIsNotBanned(vote.voterId),
				policy.audienceSubmissions.exists.where({
					authorId: { ne: vote.voterId },
					id: vote.submissionId,
					showId: vote.showId,
					status: 'approved'
				}),
				policy.shows.exists.where({
					id: vote.showId,
					status: { in: ['live', 'ended'] }
				})
			])
		);
		policy.submissionVotes.allowDelete.never();

		policy.toolCandidates.allowRead.where(canReadShow);
		policy.toolCandidates.allowInsert.where(currentUserIsAdmin);
		policy.toolCandidates.allowUpdate.where(currentUserIsAdmin);
		policy.toolCandidates.allowDelete.never();

		policy.toolPolls.allowRead.where(canReadShow);
		policy.toolPolls.allowInsert.where(currentUserIsAdmin);
		policy.toolPolls.allowUpdate.where(currentUserIsAdmin);
		policy.toolPolls.allowDelete.never();

		policy.toolVotes.allowRead.where(currentUserIsAdmin);
		policy.toolVotes.allowInsert.where((vote) =>
			allOf([
				currentSessionIsExternal,
				currentUserIsNotBanned(vote.voterId),
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
				currentSessionIsExternal,
				currentUserIsNotBanned(vote.voterId),
				policy.toolPolls.exists.where({
					id: vote.pollId,
					showId: vote.showId,
					pollOpen: true
				}),
				policy.shows.exists.where({ id: vote.showId, status: 'live' })
			])
		);
		policy.toolVotes.allowDelete.never();

		policy.toolPollResults.allowRead.where(canReadShow);
		policy.toolPollResults.allowInsert.where(currentUserIsAdmin);
		policy.toolPollResults.allowUpdate.where(currentUserIsAdmin);
		policy.toolPollResults.allowDelete.never();

		policy.feudQuestions.allowRead.where(canReadShow);
		policy.feudQuestions.allowInsert.where(currentUserIsAdmin);
		policy.feudQuestions.allowUpdate.where(currentUserIsAdmin);
		policy.feudQuestions.allowDelete.never();

		policy.feudAnswers.allowRead.where(currentUserIsAdmin);
		policy.feudAnswers.allowInsert.where((answer) =>
			allOf([
				currentSessionIsExternal,
				currentUserIsNotBanned(answer.authorId),
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
				currentSessionIsExternal,
				currentUserIsNotBanned(answer.authorId),
				policy.shows.exists.where({ id: answer.showId, status: 'live' }),
				policy.feudQuestions.exists.where({
					id: answer.questionId,
					showId: answer.showId,
					collectionOpen: true
				})
			])
		);
		policy.feudAnswers.allowDelete.never();

		policy.feudBuckets.allowRead.where(currentUserIsAdmin);
		policy.feudBuckets.allowInsert.where(currentUserIsAdmin);
		policy.feudBuckets.allowUpdate.where(currentUserIsAdmin);
		policy.feudBuckets.allowDelete.never();

		policy.feudBoardSlots.allowRead.where(canReadShow);
		policy.feudBoardSlots.allowInsert.where(currentUserIsAdmin);
		policy.feudBoardSlots.allowUpdate.where(currentUserIsAdmin);
		policy.feudBoardSlots.allowDelete.never();

		policy.feudStrikes.allowRead.where(canReadShow);
		policy.feudStrikes.allowInsert.where(currentUserIsAdmin);
		policy.feudStrikes.allowUpdate.where(currentUserIsAdmin);
		policy.feudStrikes.allowDelete.never();
	}
);
