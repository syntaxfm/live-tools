import type { PageServerLoad } from './$types';

import {
	getAdminHostOptions,
	getAppUserIdForUserId,
	assertAdminUser
} from '$lib/server/admin-host-options';

export const load: PageServerLoad = async ({ locals }) => {
	await assertAdminUser(locals.user?.id);

	return {
		adminHostOptions: await getAdminHostOptions(),
		currentAppUserId: locals.user ? await getAppUserIdForUserId(locals.user.id) : null
	};
};
