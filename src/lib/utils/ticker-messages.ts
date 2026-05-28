import type { TickerMessageView } from '$lib/components/shows/room-protocol';

const MINIMUM_LOOP_ITEMS = 8;

function compareTickerMessagesByPosition(
	first: TickerMessageView,
	second: TickerMessageView
): number {
	return first.createdAt - second.createdAt || first.id.localeCompare(second.id);
}

export function getTickerLoopMessages(messages: readonly TickerMessageView[]): TickerMessageView[] {
	const sortedMessages = [...messages].sort(compareTickerMessagesByPosition);

	if (!sortedMessages.length) {
		return [];
	}

	const repetitions = Math.max(2, Math.ceil(MINIMUM_LOOP_ITEMS / sortedMessages.length));

	return Array.from({ length: repetitions }, () => sortedMessages).flat();
}
