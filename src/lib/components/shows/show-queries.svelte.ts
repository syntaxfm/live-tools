import { QuerySubscription } from 'jazz-tools/svelte';
import { app } from '$lib/schema';
import type { ShowHost, TickerMessage } from '$lib/schema';

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

export function createTickerMessagesSubscription(
	showId: () => string | undefined
): QuerySubscription<TickerMessage> {
	return new QuerySubscription(
		() => {
			const id = showId();

			return id ? app.tickerMessages.where({ showId: id }) : undefined;
		},
		{ tier: 'global' }
	);
}
