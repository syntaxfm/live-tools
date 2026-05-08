import type { TickerMessage } from '$lib/schema';

const MINIMUM_LOOP_ITEMS = 8;

function compareTickerMessagesByPosition(first: TickerMessage, second: TickerMessage): number {
	return (
		new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime() ||
		first.id.localeCompare(second.id)
	);
}

export function getTickerLoopMessages(messages: readonly TickerMessage[]): TickerMessage[] {
	const sortedMessages = [...messages].sort(compareTickerMessagesByPosition);

	if (!sortedMessages.length) {
		return [];
	}

	const repetitions = Math.max(2, Math.ceil(MINIMUM_LOOP_ITEMS / sortedMessages.length));

	return Array.from({ length: repetitions }, () => sortedMessages).flat();
}
