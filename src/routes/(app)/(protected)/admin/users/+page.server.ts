import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { requireAdmin } from '$lib/server/require-admin';
import { better_auth_user } from '$lib/server/db/auth-schema';
import { shows } from '$lib/server/db/registry-schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals);
	if (!platform) {
		error(500, 'Platform unavailable');
	}

	const db = drizzle(platform.env.DB);
	const users = await db
		.select({
			id: better_auth_user.id,
			name: better_auth_user.name,
			githubUsername: better_auth_user.githubUsername,
			banned: better_auth_user.banned
		})
		.from(better_auth_user);

	return { users };
};

export const actions: Actions = {
	setBan: async ({ request, locals, platform }) => {
		requireAdmin(locals);
		if (!platform) error(500, 'Platform unavailable');

		const env = platform.env;
		const db = drizzle(env.DB);
		const form = await request.formData();
		const userId = String(form.get('userId') ?? '');
		const banned = form.get('banned') === '1';
		if (!userId) {
			error(400, 'User required');
		}

		await db.update(better_auth_user).set({ banned }).where(eq(better_auth_user.id, userId));

		// Write-through: a ban mid-show must block the user's next submit/vote immediately.
		const [live] = await db
			.select({ id: shows.id })
			.from(shows)
			.where(eq(shows.status, 'live'))
			.limit(1);
		if (live) {
			await env.SHOW_ROOM.get(env.SHOW_ROOM.idFromName(live.id)).setBan(userId, banned);
		}

		return { success: true };
	}
};
