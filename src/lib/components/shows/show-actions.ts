import type { Db } from 'jazz-tools';

import { app } from '$lib/schema';
import type { LowerThirdOverlay, LowerThirdOverlayInsert, ShowHost, ShowInsert } from '$lib/schema';
import type { ShowStatus } from '$lib/utils/shows';

interface AdminMutationOptions {
	db: Db;
	isAdmin: boolean;
	showId: string;
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
	appUserId: string;
	existingOverlay: LowerThirdOverlay | null;
	existingOverlays: readonly LowerThirdOverlay[];
	host: ShowHost;
}

interface ClearLowerThirdOptions extends AdminMutationOptions {
	appUserId: string;
	existingOverlays: readonly LowerThirdOverlay[];
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
	appUserId,
	db,
	existingOverlay,
	existingOverlays,
	host,
	isAdmin,
	showId
}: BroadcastLowerThirdOptions): Promise<Date> {
	assertAdmin(isAdmin);

	if (host.showId !== showId) {
		throw new Error('Host does not belong to show');
	}

	const updatedAt = new Date();

	if (existingOverlay) {
		await db
			.update(app.lowerThirdOverlays, existingOverlay.id, {
				activeShowHostId: host.id,
				updatedAt,
				updatedById: appUserId
			})
			.wait({ tier: 'global' });
		await clearStaleLowerThirdOverlays({
			appUserId,
			db,
			existingOverlays,
			updatedAt,
			activeOverlayId: existingOverlay.id
		});
		return updatedAt;
	}

	const insert: LowerThirdOverlayInsert = {
		activeShowHostId: host.id,
		showId,
		updatedAt,
		updatedById: appUserId
	};

	const overlay = await db.insert(app.lowerThirdOverlays, insert).wait({ tier: 'global' });
	await clearStaleLowerThirdOverlays({
		appUserId,
		db,
		existingOverlays,
		updatedAt,
		activeOverlayId: overlay.id
	});
	return updatedAt;
}

export async function clearLowerThird({
	appUserId,
	db,
	existingOverlays,
	isAdmin,
	showId
}: ClearLowerThirdOptions): Promise<void> {
	assertAdmin(isAdmin);

	const updatedAt = new Date();

	if (!existingOverlays.length) {
		const insert: LowerThirdOverlayInsert = {
			activeShowHostId: null,
			showId,
			updatedAt,
			updatedById: appUserId
		};

		await db.insert(app.lowerThirdOverlays, insert).wait({ tier: 'global' });
		return;
	}

	await Promise.all(
		existingOverlays.map((overlay) =>
			db
				.update(app.lowerThirdOverlays, overlay.id, {
					activeShowHostId: null,
					updatedAt,
					updatedById: appUserId
				})
				.wait({ tier: 'global' })
		)
	);
}

interface ClearStaleLowerThirdOverlaysOptions {
	appUserId: string;
	db: Db;
	existingOverlays: readonly LowerThirdOverlay[];
	updatedAt: Date;
	activeOverlayId: string;
}

async function clearStaleLowerThirdOverlays({
	appUserId,
	db,
	existingOverlays,
	updatedAt,
	activeOverlayId
}: ClearStaleLowerThirdOverlaysOptions): Promise<void> {
	await Promise.all(
		existingOverlays
			.filter((overlay) => overlay.id !== activeOverlayId && overlay.activeShowHostId)
			.map((overlay) =>
				db
					.update(app.lowerThirdOverlays, overlay.id, {
						activeShowHostId: null,
						updatedAt,
						updatedById: appUserId
					})
					.wait({ tier: 'global' })
			)
	);
}

function assertAdmin(isAdmin: boolean): void {
	if (!isAdmin) {
		throw new Error('Admin access required');
	}
}
