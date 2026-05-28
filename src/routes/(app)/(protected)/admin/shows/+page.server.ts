import { error, fail, redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { requireAdmin } from '$lib/server/require-admin';
import { announceShowStatus } from '$lib/server/show-status';
import { better_auth_user } from '$lib/server/db/auth-schema';
import { shows, showHosts, hostLinks } from '$lib/server/db/registry-schema';
import { parseShowDateInput, parseShowStatus } from '$lib/utils/shows';
import { hasRole } from '$lib/utils/roles';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals);
	if (!platform) {
		error(500, 'Platform unavailable');
	}

	const db = drizzle(platform.env.DB);
	const showList = await db.select().from(shows).orderBy(desc(shows.startsAt));
	const users = await db
		.select({ id: better_auth_user.id, name: better_auth_user.name, roles: better_auth_user.roles })
		.from(better_auth_user);
	const eligibleHosts = users
		.filter((user) => hasRole(user.roles, 'host'))
		.map((user) => ({ id: user.id, name: user.name }));

	return { shows: showList, eligibleHosts };
};

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		const admin = requireAdmin(locals);
		if (!platform) error(500, 'Platform unavailable');

		const db = drizzle(platform.env.DB);
		const form = await request.formData();
		const hostIds = form.getAll('hostId').map(String);

		let status: ReturnType<typeof parseShowStatus>;
		let startsAt: Date;
		try {
			status = parseShowStatus(String(form.get('status') ?? ''));
			startsAt = parseShowDateInput(String(form.get('startsAt') ?? ''));
		} catch {
			return fail(400, { message: 'Invalid date or status' });
		}

		let showId: string;
		try {
			const [created] = await db
				.insert(shows)
				.values({ status, startsAt, createdAt: new Date(), createdById: admin.id })
				.returning({ id: shows.id });
			showId = created.id;
		} catch {
			return fail(409, { message: 'Another show is already live' });
		}

		if (hostIds.length) {
			const users = await db
				.select({ id: better_auth_user.id, name: better_auth_user.name })
				.from(better_auth_user);
			const nameById = new Map(users.map((user) => [user.id, user.name]));
			for (const hostId of hostIds) {
				if (nameById.has(hostId)) {
					await db
						.insert(showHosts)
						.values({ showId, hostId, displayName: nameById.get(hostId) ?? 'Host' });
				}
			}
		}

		// A show created directly as live must activate its room + announce to the directory.
		await announceShowStatus(platform.env, showId, status);

		redirect(303, `/admin/shows/${showId}`);
	},

	delete: async ({ request, locals, platform }) => {
		requireAdmin(locals);
		if (!platform) error(500, 'Platform unavailable');

		const env = platform.env;
		const db = drizzle(env.DB);
		const showId = String((await request.formData()).get('showId') ?? '');
		if (!showId) {
			return fail(400, { message: 'Show required' });
		}

		const [existing] = await db
			.select({ status: shows.status })
			.from(shows)
			.where(eq(shows.id, showId))
			.limit(1);

		await db.delete(hostLinks).where(eq(hostLinks.showId, showId));
		await db.delete(showHosts).where(eq(showHosts.showId, showId));
		await db.delete(shows).where(eq(shows.id, showId));

		if (existing?.status === 'live') {
			await env.SHOW_DIRECTORY.get(env.SHOW_DIRECTORY.idFromName('live')).setLiveShow(null);
		}

		return { success: true };
	}
};
