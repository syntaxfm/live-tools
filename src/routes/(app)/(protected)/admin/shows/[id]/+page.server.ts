import { error, fail } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { requireAdmin } from '$lib/server/require-admin';
import { announceShowStatus } from '$lib/server/show-status';
import { better_auth_user } from '$lib/server/db/auth-schema';
import { shows, showHosts } from '$lib/server/db/registry-schema';
import { parseShowStatus } from '$lib/utils/shows';
import { hasRole } from '$lib/utils/roles';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	requireAdmin(locals);
	if (!platform) {
		error(500, 'Platform unavailable');
	}

	const db = drizzle(platform.env.DB);
	const [show] = await db.select().from(shows).where(eq(shows.id, params.id)).limit(1);
	if (!show) {
		error(404, 'Show not found');
	}
	const hosts = await db.select().from(showHosts).where(eq(showHosts.showId, params.id));

	const users = await db
		.select({ id: better_auth_user.id, name: better_auth_user.name, roles: better_auth_user.roles })
		.from(better_auth_user);
	const eligibleHosts = users
		.filter((user) => hasRole(user.roles, 'host'))
		.map((user) => ({ id: user.id, name: user.name }));

	return { show, hosts, eligibleHosts };
};

export const actions: Actions = {
	status: async ({ request, params, locals, platform }) => {
		requireAdmin(locals);
		if (!platform) error(500, 'Platform unavailable');

		const env = platform.env;
		const db = drizzle(env.DB);
		const status = parseShowStatus(String((await request.formData()).get('status')));

		try {
			await db
				.update(shows)
				.set({ status, endedAt: status === 'ended' ? new Date() : null })
				.where(eq(shows.id, params.id));
		} catch {
			// The partial unique index on status='live' rejects a second live show.
			return fail(409, { message: 'Another show is already live' });
		}

		await announceShowStatus(env, params.id, status);
		return { success: true };
	},

	assignHosts: async ({ request, params, locals, platform }) => {
		requireAdmin(locals);
		if (!platform) error(500, 'Platform unavailable');

		const env = platform.env;
		const db = drizzle(env.DB);
		const selectedIds = (await request.formData()).getAll('hostId').map(String);

		const current = await db.select().from(showHosts).where(eq(showHosts.showId, params.id));
		const currentIds = new Set(current.map((host) => host.hostId));
		const selectedSet = new Set(selectedIds);

		const toAdd = selectedIds.filter((id) => !currentIds.has(id));
		const toRemove = current.filter((host) => !selectedSet.has(host.hostId));

		if (toAdd.length) {
			const users = await db
				.select({ id: better_auth_user.id, name: better_auth_user.name })
				.from(better_auth_user)
				.where(inArray(better_auth_user.id, toAdd));
			const nameById = new Map(users.map((user) => [user.id, user.name]));
			for (const hostId of toAdd) {
				await db
					.insert(showHosts)
					.values({ showId: params.id, hostId, displayName: nameById.get(hostId) ?? 'Host' });
			}
		}
		for (const host of toRemove) {
			await db.delete(showHosts).where(eq(showHosts.id, host.id));
		}

		await env.SHOW_ROOM.get(env.SHOW_ROOM.idFromName(params.id)).syncHosts(params.id);
		return { success: true };
	},

	updateHostTitle: async ({ request, params, locals, platform }) => {
		requireAdmin(locals);
		if (!platform) error(500, 'Platform unavailable');

		const env = platform.env;
		const db = drizzle(env.DB);
		const form = await request.formData();
		const showHostId = String(form.get('showHostId'));
		const title = String(form.get('title') ?? '').trim() || null;

		await db
			.update(showHosts)
			.set({ lowerThirdTitle: title })
			.where(and(eq(showHosts.id, showHostId), eq(showHosts.showId, params.id)));

		await env.SHOW_ROOM.get(env.SHOW_ROOM.idFromName(params.id)).syncHosts(params.id);
		return { success: true };
	}
};
