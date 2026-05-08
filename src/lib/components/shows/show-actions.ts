import type { Db } from 'jazz-tools';
import { app } from '$lib/schema';
import type { Show, User } from '$lib/schema';
import type { ShowStatus } from '$lib/utils/shows';

interface AdminMutationOptions {
	db: Db;
	is_admin: boolean;
	showId: string;
}

interface CreateShowOptions {
	createdById: string;
	db: Db;
	hosts: readonly User[];
	is_admin: boolean;
	startsAt: Date;
	status: ShowStatus;
}

interface UpdateAudienceSubmissionGateOptions extends AdminMutationOptions {
	isOpen: boolean;
}

export async function createShow({
	createdById,
	db,
	hosts,
	is_admin,
	startsAt,
	status
}: CreateShowOptions): Promise<Show> {
	assertAdmin(is_admin);

	const show = await db
		.insert(app.shows, {
			status,
			audienceSubmissionsOpen: false,
			createdById,
			startsAt,
			createdAt: new Date()
		})
		.wait({ tier: 'global' });

	await Promise.all(
		hosts.map((host) =>
			db
				.insert(app.showHosts, {
					showId: show.id,
					hostId: host.id,
					displayName: host.name
				})
				.wait({ tier: 'global' })
		)
	);

	return show;
}

export async function updateAudienceSubmissionGate({
	db,
	is_admin,
	isOpen,
	showId
}: UpdateAudienceSubmissionGateOptions): Promise<void> {
	assertAdmin(is_admin);

	await db
		.update(app.shows, showId, {
			audienceSubmissionsOpen: isOpen
		})
		.wait({ tier: 'global' });
}

export async function deleteShow({ db, is_admin, showId }: AdminMutationOptions): Promise<void> {
	assertAdmin(is_admin);

	const [audienceSubmissions, hostLinks, showHosts, submissionVotes, tickerMessages] =
		await Promise.all([
			db.all(app.audienceSubmissions.where({ showId }), { tier: 'global' }),
			db.all(app.hostLinks.where({ showId }), { tier: 'global' }),
			db.all(app.showHosts.where({ showId }), { tier: 'global' }),
			db.all(app.submissionVotes.where({ showId }), { tier: 'global' }),
			db.all(app.tickerMessages.where({ showId }), { tier: 'global' })
		]);

	await db
		.update(app.shows, showId, {
			activeLowerThirdShowHostId: null
		})
		.wait({ tier: 'global' });

	await Promise.all(
		submissionVotes.map((vote) => db.delete(app.submissionVotes, vote.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		audienceSubmissions.map((submission) =>
			db.delete(app.audienceSubmissions, submission.id).wait({ tier: 'global' })
		)
	);

	await Promise.all(
		hostLinks.map((link) => db.delete(app.hostLinks, link.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		tickerMessages.map((message) =>
			db.delete(app.tickerMessages, message.id).wait({ tier: 'global' })
		)
	);

	await Promise.all(
		showHosts.map((host) => db.delete(app.showHosts, host.id).wait({ tier: 'global' }))
	);

	await db.delete(app.shows, showId).wait({ tier: 'global' });
}

export function assertAdmin(is_admin: boolean): void {
	if (!is_admin) {
		throw new Error('Admin access required');
	}
}
