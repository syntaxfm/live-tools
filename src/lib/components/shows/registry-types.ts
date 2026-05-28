// Client-facing shapes for the D1 "registry" entities (durable, cross-show data) that
// server loads return and components render. The server source of truth is the Drizzle
// schema under $lib/server/db; these mirror its row shapes without importing server-only
// code into the client bundle. Live "room state" is not here — it arrives via the room
// store's snapshot.

export type ShowStatus = 'draft' | 'live' | 'ended';

export interface Show {
	id: string;
	status: ShowStatus;
	startsAt: Date;
	endedAt: Date | null;
	createdAt: Date;
	createdById: string;
}

export interface ShowHost {
	id: string;
	showId: string;
	hostId: string;
	displayName: string;
	lowerThirdTitle: string | null;
}

export interface HostLink {
	id: string;
	showId: string;
	showHostId: string;
	url: string;
	title: string | null;
	notes: string | null;
}
