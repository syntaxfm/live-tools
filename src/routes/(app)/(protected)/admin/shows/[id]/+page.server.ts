import type { PageServerLoad } from './$types';

import { getAdminHostOptions, assertAdminUser } from '$lib/server/admin-host-options';

export const load: PageServerLoad = async ({ locals }) => {
	await assertAdminUser(locals.user?.id);

	return {
		adminHostOptions: await getAdminHostOptions()
	};
};
