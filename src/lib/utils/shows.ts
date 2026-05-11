import type { Show } from '$lib/schema';

export type ShowStatus = Show['status'];

export const SHOW_STATUSES: readonly ShowStatus[] = ['draft', 'live', 'ended'];

export function parseShowStatus(value: string): ShowStatus {
	if (SHOW_STATUSES.includes(value as ShowStatus)) {
		return value as ShowStatus;
	}

	throw new TypeError('Invalid show status');
}

export function formatShowDate(timestamp: Show['startsAt'] | null): string {
	if (!timestamp) {
		return 'Unscheduled';
	}

	return new Date(timestamp).toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

export function formatShowDateInput(timestamp: Date): string {
	return [
		timestamp.getFullYear(),
		String(timestamp.getMonth() + 1).padStart(2, '0'),
		String(timestamp.getDate()).padStart(2, '0')
	].join('-');
}

export function parseShowDateInput(value: string): Date {
	const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/.exec(value);

	if (!match?.groups) {
		throw new TypeError('Invalid show date');
	}

	const year = Number(match.groups.year);
	const month = Number(match.groups.month);
	const day = Number(match.groups.day);
	const date = new Date(year, month - 1, day);

	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		throw new TypeError('Invalid show date');
	}

	return date;
}
