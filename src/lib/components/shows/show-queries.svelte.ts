import { QuerySubscription } from 'jazz-tools/svelte';

import { app } from '$lib/schema';
import type { Show, ShowHost } from '$lib/schema';

export function createShowSubscription(showId: () => string | undefined): QuerySubscription<Show> {
	return new QuerySubscription(
		() => {
			const id = showId();

			return id ? app.shows.where({ id }) : undefined;
		},
		{ tier: 'global' }
	);
}

export function createShowHostsSubscription(
	showId: () => string | undefined
): QuerySubscription<ShowHost> {
	return new QuerySubscription(
		() => {
			const id = showId();

			return id ? app.showHosts.where({ showId: id }) : undefined;
		},
		{ tier: 'global' }
	);
}
