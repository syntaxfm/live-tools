import { QuerySubscription } from 'jazz-tools/svelte';

import { app } from '$lib/schema';
import type { LowerThirdOverlay, Show, ShowHost } from '$lib/schema';

export function createShowsSubscription(): QuerySubscription<Show> {
	return new QuerySubscription(app.shows.where({}), { tier: 'global' });
}

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

export function createShowHostSubscription(
	showHostId: () => string | undefined
): QuerySubscription<ShowHost> {
	return new QuerySubscription(
		() => {
			const id = showHostId();

			return id ? app.showHosts.where({ id }) : undefined;
		},
		{ tier: 'global' }
	);
}

export function createLowerThirdOverlaySubscription(
	showId: () => string | undefined
): QuerySubscription<LowerThirdOverlay> {
	return new QuerySubscription(
		() => {
			const id = showId();

			return id ? app.lowerThirdOverlays.where({ showId: id }) : undefined;
		},
		{ tier: 'global' }
	);
}
