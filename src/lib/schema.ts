import { schema as s } from 'jazz-tools';

import { schema as betterAuthSchema } from './schema-better-auth/schema';

const schema = {
	...betterAuthSchema,

	shows: s
		.table({
			status: s.enum('draft', 'live', 'ended').default('draft'),
			audienceSubmissionsOpen: s.boolean().default(false),
			activeLowerThirdShowHostId: s.ref('showHosts').optional(),
			createdById: s.ref('better_auth_user'),
			startsAt: s.timestamp(),
			endedAt: s.timestamp().optional(),
			createdAt: s.timestamp()
		})
		.index('byStatus', ['status'])
		.index('byStartsAt', ['startsAt']),

	showHosts: s
		.table({
			showId: s.ref('shows'),
			hostId: s.ref('better_auth_user'),
			displayName: s.string(),
			lowerThirdTitle: s.string().optional()
		})
		.index('byShowHost', ['showId', 'hostId']),

	// Host-authored source links for show prep. These can later become tool candidates.
	hostLinks: s
		.table({
			showId: s.ref('shows'),
			showHostId: s.ref('showHosts'),
			url: s.string(),
			title: s.string().optional(),
			notes: s.string().optional()
		})
		.index('byShowHost', ['showId', 'showHostId']),

	tickerMessages: s.table({
		showId: s.ref('shows'),
		text: s.string(),
		createdById: s.ref('better_auth_user'),
		createdAt: s.timestamp(),
		updatedAt: s.timestamp().optional()
	}),

	audienceSubmissions: s
		.table({
			showId: s.ref('shows'),
			authorId: s.ref('better_auth_user'),
			kind: s.enum('post', 'tool'),
			url: s.string(),
			title: s.string().optional(),
			notes: s.string().optional(),
			status: s.enum('pending', 'approved', 'rejected').default('pending'),
			isFeatured: s.boolean().default(false),
			createdAt: s.timestamp(),
			updatedAt: s.timestamp().optional()
		})
		.index('byShowStatus', ['showId', 'status'])
		.index('byShowKindStatus', ['showId', 'kind', 'status'])
		.index('byShowAuthor', ['showId', 'authorId']),

	submissionVotes: s
		.table({
			showId: s.ref('shows'),
			submissionId: s.ref('audienceSubmissions'),
			voterId: s.ref('better_auth_user'),
			createdAt: s.timestamp()
		})
		.index('byShow', ['showId'])
		.index('bySubmission', ['submissionId'])
		.index('bySubmissionVoter', ['submissionId', 'voterId'])
		.index('byShowVoter', ['showId', 'voterId'])
};

type AppSchema = s.Schema<typeof schema>;

export const app: s.App<AppSchema> = s.defineApp(schema);

export type AppUser = s.RowOf<typeof app.better_auth_user>;
export type Show = s.RowOf<typeof app.shows>;
export type ShowHost = s.RowOf<typeof app.showHosts>;
export type TickerMessage = s.RowOf<typeof app.tickerMessages>;
export type AudienceSubmission = s.RowOf<typeof app.audienceSubmissions>;
export type SubmissionVote = s.RowOf<typeof app.submissionVotes>;
export type ShowInsert = s.InsertOf<typeof app.shows>;
export type ShowHostInsert = s.InsertOf<typeof app.showHosts>;
export type TickerMessageInsert = s.InsertOf<typeof app.tickerMessages>;
export type AudienceSubmissionInsert = s.InsertOf<typeof app.audienceSubmissions>;
export type SubmissionVoteInsert = s.InsertOf<typeof app.submissionVotes>;
