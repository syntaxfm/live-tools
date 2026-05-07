import type { Show, ShowHost } from '$lib/schema';

export type ShowRouteSurface = 'viewer' | 'host' | 'admin';
export type ShowStatus = Show['status'];

export const SHOW_STATUSES: readonly ShowStatus[] = ['draft', 'live', 'ended'];

interface ShowActivityState {
	status: ShowStatus;
}

interface AudienceSubmissionGateState extends ShowActivityState {
	audienceSubmissionsOpen: boolean;
}

interface ShowSelectionState {
	id: string;
	createdAt: Show['createdAt'];
	startsAt: Show['startsAt'];
	status: ShowStatus;
}

const SHOW_ROUTE_PREFIXES: Record<ShowRouteSurface, string> = {
	viewer: '/show',
	host: '/host/shows',
	admin: '/admin/shows'
};

export function isPublicShowStatus(status: ShowStatus): boolean {
	return status === 'live' || status === 'ended';
}

export function isLiveShow(show: ShowActivityState): boolean {
	return show.status === 'live';
}

export function canUseAudienceSubmissionGate(show: AudienceSubmissionGateState): boolean {
	return isLiveShow(show) && show.audienceSubmissionsOpen;
}

export function parseShowStatus(value: string): ShowStatus {
	if (SHOW_STATUSES.includes(value as ShowStatus)) {
		return value as ShowStatus;
	}

	throw new TypeError('Invalid show status');
}

export function compareShowsByRecency(
	first: ShowSelectionState,
	second: ShowSelectionState
): number {
	return (
		getShowTime(second.startsAt) - getShowTime(first.startsAt) ||
		getShowTime(second.createdAt) - getShowTime(first.createdAt) ||
		second.id.localeCompare(first.id)
	);
}

export function compareShowHostsByPosition(first: ShowHost, second: ShowHost): number {
	return first.position - second.position || first.displayName.localeCompare(second.displayName);
}

export function getShowPath(surface: ShowRouteSurface, showId: string): string {
	return `${SHOW_ROUTE_PREFIXES[surface]}/${showId}`;
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

function getShowTime(timestamp: Show['startsAt'] | Show['createdAt']): number {
	return new Date(timestamp).getTime();
}
