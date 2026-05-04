import { dev } from '$app/environment';
import { QuerySubscription, getJazzContext } from 'jazz-tools/svelte';

import { app } from '$lib/schema';
import type { AppUser } from '$lib/schema';

export function createCurrentAppUserSubscription(): QuerySubscription<AppUser> {
	const jazzContext = getJazzContext();

	return new QuerySubscription(
		() => {
			const session = jazzContext.session;

			if (session?.authMode === 'external') {
				return app.appUsers.where({ externalUserId: session.user_id });
			}

			if (dev && session?.authMode === 'local-first') {
				return app.appUsers.where({ id: session.user_id });
			}

			return undefined;
		},
		{ tier: 'global' }
	);
}

export function createAppUsersSubscription(): QuerySubscription<AppUser> {
	return new QuerySubscription(app.appUsers.where({}), { tier: 'global' });
}
