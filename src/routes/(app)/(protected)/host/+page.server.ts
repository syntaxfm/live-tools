import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { shows } from '$lib/server/db/registry-schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		error(401, 'Sign in required');
	}
	if (!platform) {
		error(500, 'Platform unavailable');
	}

	const db = drizzle(platform.env.DB);
	const [live] = await db
		.select({ id: shows.id })
		.from(shows)
		.where(eq(shows.status, 'live'))
		.limit(1);

	return { liveShowId: live?.id ?? null };
};
