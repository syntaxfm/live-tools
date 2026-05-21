import { schema as s } from 'jazz-tools';

import { app } from './schema';

export const permissions = s.definePermissions(
	app,
	({ policy, allOf, allowedTo, anyOf, session }) => {
		const is_admin = session.where({ 'claims.is_admin': true });
		const is_logged_in = session.where({ authMode: 'external' });

		const not_banned = policy.better_auth_user.exists.where({
			id: session.user_id,
			banned: false
		});

		const canReadShow = allowedTo.read('show');

		policy.better_auth_user.allowRead.where({ id: session.user_id });
		policy.better_auth_user.allowReads.where(is_admin);
		policy.better_auth_user.allowUpdate.where(anyOf([{ id: session.user_id }, is_admin]));
		policy.better_auth_user.allowDelete.where(is_admin);

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

		policy.audienceSubmissions.allowRead.where(() =>
			anyOf([is_admin, allOf([{ status: 'approved' }, canReadShow])])
		);
		policy.audienceSubmissions.allowInsert.where((submission) =>
			anyOf([
				is_admin,
				allOf([
					{ status: 'pending', isFeatured: false },
					not_banned,
					is_logged_in,
					policy.shows.exists.where({
						id: submission.showId,
						status: 'live',
						audienceSubmissionsOpen: true
					})
				])
			])
		);
		policy.audienceSubmissions.allowUpdate.where(is_admin);
		policy.audienceSubmissions.allowDelete.where(is_admin);

		policy.submissionVotes.allowRead.where(canReadShow);
		policy.submissionVotes.allowInsert.where((vote) =>
			allOf([
				is_logged_in,
				not_banned,
				{ voterId: session.user_id },
				policy.shows.exists.where({ id: vote.showId, status: 'live' }),
				policy.audienceSubmissions.exists.where({
					id: vote.submissionId,
					status: 'approved',
					authorId: { ne: session.user_id }
				})
			])
		);
		policy.submissionVotes.allowUpdate.never();
		policy.submissionVotes.allowDelete.where(anyOf([is_admin, { voterId: session.user_id }]));
	}
);
