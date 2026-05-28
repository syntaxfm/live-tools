import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { requireAdmin } from '$lib/server/require-admin';
import { shows } from '$lib/server/db/registry-schema';
import type { PageServerLoad } from './$types';

// The dashboard is the operator console for the live show. There is at most one live show
// (enforced in D1), so route straight to its console; otherwise prompt to pick a show.
export const load: PageServerLoad = async ({ locals, platform }) => {
	requireAdmin(locals);
	if (!platform) {
		error(500, 'Platform unavailable');
	}

	const db = drizzle(platform.env.DB);
	const [live] = await db
		.select({ id: shows.id })
		.from(shows)
		.where(eq(shows.status, 'live'))
		.limit(1);
	if (live) {
		redirect(307, `/admin/shows/${live.id}`);
	}

	return {};
};
