import type { TickerMessage } from '$lib/schema';

const MINIMUM_LOOP_ITEMS = 8;

export function compareTickerMessagesByPosition(
	first: TickerMessage,
	second: TickerMessage
): number {
	return (
		first.position - second.position ||
		new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime() ||
		first.id.localeCompare(second.id)
	);
}

export function getNextTickerMessagePosition(messages: readonly TickerMessage[]): number {
	return messages.reduce((position, message) => Math.max(position, message.position + 1), 0);
}

export function getTickerLoopMessages(messages: readonly TickerMessage[]): TickerMessage[] {
	const sortedMessages = [...messages].sort(compareTickerMessagesByPosition);

	if (!sortedMessages.length) {
		return [];
	}

	const repetitions = Math.max(2, Math.ceil(MINIMUM_LOOP_ITEMS / sortedMessages.length));

	return Array.from({ length: repetitions }, () => sortedMessages).flat();
}
