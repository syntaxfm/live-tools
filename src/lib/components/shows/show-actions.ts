import type { Db } from 'jazz-tools';

import type { ShowHostOption } from '$lib/components/shows/show-host-options';
import { app } from '$lib/schema';
import type { Show, ShowHost, ShowInsert, TickerMessage } from '$lib/schema';
import type { ShowStatus } from '$lib/utils/shows';
import { getNextTickerMessagePosition } from '$lib/utils/ticker-messages';

interface AdminMutationOptions {
	db: Db;
	isAdmin: boolean;
	showId: string;
}

interface CreateShowOptions {
	createdById: string;
	db: Db;
	hosts: readonly ShowHostOption[];
	isAdmin: boolean;
	startsAt: Date;
	status: ShowStatus;
}

interface UpdateShowStatusOptions extends AdminMutationOptions {
	status: ShowStatus;
}

interface UpdateAudienceSubmissionGateOptions extends AdminMutationOptions {
	isOpen: boolean;
}

interface UpdateShowHostLowerThirdTitleOptions extends AdminMutationOptions {
	host: ShowHost;
	title: string;
}

interface BroadcastLowerThirdOptions extends AdminMutationOptions {
	host: ShowHost;
}

interface UpdateShowHostsOptions extends AdminMutationOptions {
	activeLowerThirdShowHostId: string | null | undefined;
	currentHosts: readonly ShowHost[];
	hosts: readonly ShowHostOption[];
}

interface AddTickerMessageOptions extends AdminMutationOptions {
	createdById: string;
	messages: readonly TickerMessage[];
	text: string;
}

interface DeleteTickerMessageOptions extends AdminMutationOptions {
	message: TickerMessage;
}

// Jazz currently persists this ref reliably when it is a UUID, but clearing it to null
// can settle globally and then materialize back to the previous host id.
const HIDDEN_LOWER_THIRD_SHOW_HOST_ID = '00000000-0000-4000-8000-000000000001';

export async function createShow({
	createdById,
	db,
	hosts,
	isAdmin,
	startsAt,
	status
}: CreateShowOptions): Promise<Show> {
	assertAdmin(isAdmin);

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
		hosts.map((host, position) =>
			db
				.insert(app.showHosts, {
					showId: show.id,
					hostId: host.id,
					displayName: host.displayName,
					avatarUrl: host.avatarUrl ?? null,
					position
				})
				.wait({ tier: 'global' })
		)
	);

	return show;
}

export async function updateShowStatus({
	db,
	isAdmin,
	showId,
	status
}: UpdateShowStatusOptions): Promise<void> {
	assertAdmin(isAdmin);

	const updates: Partial<ShowInsert> =
		status === 'ended'
			? {
					status,
					endedAt: new Date()
				}
			: {
					status,
					endedAt: null
				};

	await db.update(app.shows, showId, updates).wait({ tier: 'global' });
}

export async function updateAudienceSubmissionGate({
	db,
	isAdmin,
	isOpen,
	showId
}: UpdateAudienceSubmissionGateOptions): Promise<void> {
	assertAdmin(isAdmin);

	await db
		.update(app.shows, showId, {
			audienceSubmissionsOpen: isOpen
		})
		.wait({ tier: 'global' });
}

export async function updateShowHostLowerThirdTitle({
	db,
	host,
	isAdmin,
	showId,
	title
}: UpdateShowHostLowerThirdTitleOptions): Promise<void> {
	assertAdmin(isAdmin);

	if (host.showId !== showId) {
		throw new Error('Host does not belong to show');
	}

	await db
		.update(app.showHosts, host.id, {
			lowerThirdTitle: title.trim() || null
		})
		.wait({ tier: 'global' });
}

export async function broadcastLowerThird({
	db,
	host,
	isAdmin,
	showId
}: BroadcastLowerThirdOptions): Promise<void> {
	assertAdmin(isAdmin);

	if (host.showId !== showId) {
		throw new Error('Host does not belong to show');
	}

	await db
		.update(app.shows, showId, {
			activeLowerThirdShowHostId: host.id
		})
		.wait({ tier: 'global' });
}

export async function updateShowHosts({
	activeLowerThirdShowHostId,
	currentHosts,
	db,
	hosts,
	isAdmin,
	showId
}: UpdateShowHostsOptions): Promise<void> {
	assertAdmin(isAdmin);

	if (currentHosts.some((host) => host.showId !== showId)) {
		throw new Error('Host does not belong to show');
	}

	const nextHostIds = new Set(hosts.map((host) => host.id));
	const currentHostsByHostId = new Map(currentHosts.map((host) => [host.hostId, host]));
	const removedHosts = currentHosts.filter((host) => !nextHostIds.has(host.hostId));

	if (
		activeLowerThirdShowHostId &&
		removedHosts.some((host) => host.id === activeLowerThirdShowHostId)
	) {
		await db
			.update(app.shows, showId, {
				activeLowerThirdShowHostId: HIDDEN_LOWER_THIRD_SHOW_HOST_ID
			})
			.wait({ tier: 'global' });
	}

	await Promise.all(
		hosts.map((host, position) => {
			const currentHost = currentHostsByHostId.get(host.id);

			if (currentHost) {
				return db
					.update(app.showHosts, currentHost.id, {
						displayName: host.displayName,
						avatarUrl: host.avatarUrl ?? null,
						position
					})
					.wait({ tier: 'global' });
			}

			return db
				.insert(app.showHosts, {
					showId,
					hostId: host.id,
					displayName: host.displayName,
					avatarUrl: host.avatarUrl ?? null,
					position
				})
				.wait({ tier: 'global' });
		})
	);

	await Promise.all(
		removedHosts.map((host) => db.delete(app.showHosts, host.id).wait({ tier: 'global' }))
	);
}
export async function clearLowerThird({
	db,
	isAdmin,
	showId
}: AdminMutationOptions): Promise<void> {
	assertAdmin(isAdmin);

	const handle = db.update(app.shows, showId, {
		activeLowerThirdShowHostId: HIDDEN_LOWER_THIRD_SHOW_HOST_ID
	});

	console.log('[lower-third:clear] batch', handle.batchId, { showId });

	try {
		await handle.wait({ tier: 'global' });
		console.log('[lower-third:clear] persisted', handle.batchId);

		const persistedShow = await db.one(app.shows.where({ id: showId }), { tier: 'global' });
		console.log('[lower-third:clear] readback', {
			activeLowerThirdShowHostId: persistedShow?.activeLowerThirdShowHostId ?? null,
			showId
		});
	} catch (error) {
		console.error('[lower-third:clear] rejected', handle.batchId, error);
		throw error;
	}
}

export async function addTickerMessage({
	createdById,
	db,
	isAdmin,
	messages,
	showId,
	text
}: AddTickerMessageOptions): Promise<void> {
	assertAdmin(isAdmin);

	const trimmedText = text.trim();

	if (!trimmedText) {
		throw new TypeError('Ticker message required');
	}

	await db
		.insert(app.tickerMessages, {
			showId,
			text: trimmedText,
			position: getNextTickerMessagePosition(messages),
			createdById,
			createdAt: new Date()
		})
		.wait({ tier: 'global' });
}

export async function deleteTickerMessage({
	db,
	isAdmin,
	message,
	showId
}: DeleteTickerMessageOptions): Promise<void> {
	assertAdmin(isAdmin);

	if (message.showId !== showId) {
		throw new Error('Ticker message does not belong to show');
	}

	await db.delete(app.tickerMessages, message.id).wait({ tier: 'global' });
}

export async function deleteShow({ db, isAdmin, showId }: AdminMutationOptions): Promise<void> {
	assertAdmin(isAdmin);

	const [
		audienceSubmissions,
		featuredSubmissionOverlays,
		feudAnswers,
		feudBoardSlots,
		feudBuckets,
		feudQuestions,
		feudStrikes,
		hostLinks,
		showHosts,
		submissionVotes,
		tickerMessages,
		toolCandidates,
		toolPollResults,
		toolPolls,
		toolVotes
	] = await Promise.all([
		db.all(app.audienceSubmissions.where({ showId }), { tier: 'global' }),
		db.all(app.featuredSubmissionOverlays.where({ showId }), { tier: 'global' }),
		db.all(app.feudAnswers.where({ showId }), { tier: 'global' }),
		db.all(app.feudBoardSlots.where({ showId }), { tier: 'global' }),
		db.all(app.feudBuckets.where({ showId }), { tier: 'global' }),
		db.all(app.feudQuestions.where({ showId }), { tier: 'global' }),
		db.all(app.feudStrikes.where({ showId }), { tier: 'global' }),
		db.all(app.hostLinks.where({ showId }), { tier: 'global' }),
		db.all(app.showHosts.where({ showId }), { tier: 'global' }),
		db.all(app.submissionVotes.where({ showId }), { tier: 'global' }),
		db.all(app.tickerMessages.where({ showId }), { tier: 'global' }),
		db.all(app.toolCandidates.where({ showId }), { tier: 'global' }),
		db.all(app.toolPollResults.where({ showId }), { tier: 'global' }),
		db.all(app.toolPolls.where({ showId }), { tier: 'global' }),
		db.all(app.toolVotes.where({ showId }), { tier: 'global' })
	]);

	await db
		.update(app.shows, showId, {
			activeLowerThirdShowHostId: null
		})
		.wait({ tier: 'global' });

	await Promise.all(
		feudBuckets.map((bucket) =>
			db
				.update(app.feudBuckets, bucket.id, {
					mergedIntoBucketId: null
				})
				.wait({ tier: 'global' })
		)
	);

	await Promise.all(
		submissionVotes.map((vote) => db.delete(app.submissionVotes, vote.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		featuredSubmissionOverlays.map((overlay) =>
			db.delete(app.featuredSubmissionOverlays, overlay.id).wait({ tier: 'global' })
		)
	);

	await Promise.all(
		toolVotes.map((vote) => db.delete(app.toolVotes, vote.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		toolPollResults.map((result) =>
			db.delete(app.toolPollResults, result.id).wait({ tier: 'global' })
		)
	);

	await Promise.all(
		toolPolls.map((poll) => db.delete(app.toolPolls, poll.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		feudAnswers.map((answer) => db.delete(app.feudAnswers, answer.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		feudBoardSlots.map((slot) => db.delete(app.feudBoardSlots, slot.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		feudStrikes.map((strike) => db.delete(app.feudStrikes, strike.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		feudBuckets.map((bucket) => db.delete(app.feudBuckets, bucket.id).wait({ tier: 'global' }))
	);

	await Promise.all(
		feudQuestions.map((question) =>
			db.delete(app.feudQuestions, question.id).wait({ tier: 'global' })
		)
	);

	await Promise.all(
		toolCandidates.map((candidate) =>
			db.delete(app.toolCandidates, candidate.id).wait({ tier: 'global' })
		)
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

function assertAdmin(isAdmin: boolean): void {
	if (!isAdmin) {
		throw new Error('Admin access required');
	}
}
