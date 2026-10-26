// Wire protocol shared by the per-show ShowRoom Durable Object (server) and the
// WebSocket-backed room store (client). The DO pre-shapes each consumer's payload from its
// connection class and sends a full snapshot on connect and on every change; the client
// reads fields off it. Overlays carry zero app logic — the DO decides visibility.

export type ConnectionClass = 'anonymous' | 'viewer' | 'admin';

export type SubmissionKind = 'post' | 'tool';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface TickerMessageView {
	id: string;
	text: string;
	createdAt: number;
}

export interface LowerThirdView {
	showHostId: string;
	displayName: string;
	lowerThirdTitle: string | null;
}

export interface SubmissionView {
	id: string;
	kind: SubmissionKind;
	url: string;
	title: string | null;
	notes: string | null;
	status: SubmissionStatus;
	isFeatured: boolean;
	authorId: string;
	voteCount: number;
	// Whether the connection's own user has voted for this submission (false for anonymous).
	hasVoted: boolean;
	createdAt: number;
}

export interface RoomSnapshot {
	showId: string;
	submissionsOpen: boolean;
	// True when the connection's user may submit/vote (logged in, not banned). The DO sets
	// this per connection; the homepage gates its submit/vote affordances on it.
	canParticipate: boolean;
	ticker: TickerMessageView[];
	lowerThird: LowerThirdView | null;
	// Shaped to what this connection may read: approved for everyone, the viewer's own
	// pending too, the full set for admins.
	submissions: SubmissionView[];
	featured: SubmissionView | null;
}

export type RoomClientMessage =
	| { type: 'ticker:add'; text: string }
	| { type: 'ticker:delete'; id: string }
	| { type: 'lowerThird:broadcast'; showHostId: string }
	| { type: 'lowerThird:hide' }
	| { type: 'submissions:setOpen'; open: boolean }
	| {
			type: 'submission:create';
			kind: SubmissionKind;
			url: string;
			title: string | null;
			notes: string | null;
	  }
	| { type: 'submission:setStatus'; id: string; status: SubmissionStatus }
	| { type: 'submission:delete'; id: string }
	| { type: 'submission:feature'; id: string }
	| { type: 'submission:clearFeatured' }
	| { type: 'vote:set'; submissionId: string; voted: boolean };

export type RoomServerMessage =
	{ type: 'snapshot'; snapshot: RoomSnapshot } | { type: 'error'; message: string };

// Directory DO → overlay/homepage: which show is live (so read clients auto-follow it).
export type DirectoryServerMessage = { type: 'live'; showId: string | null };

// Lower thirds auto-hide after this long, via a single DO Alarm (no in-DO timers — see
// docs/adr/0002-websocket-hibernation-and-alarm-auto-hide.md).
export const LOWER_THIRD_DISPLAY_MS = 10_000;
