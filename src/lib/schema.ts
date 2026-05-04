import { schema as s } from 'jazz-tools';

import { schema as betterAuthSchema } from './schema-better-auth/schema';

const schema = {
	...betterAuthSchema,

	appUsers: s
		.table({
			externalUserId: s.string(),
			githubUsername: s.string().optional(),
			displayName: s.string(),
			avatarUrl: s.string().optional(),
			isBanned: s.boolean().default(false)
		})
		.index('byExternalUser', ['externalUserId']),

	shows: s
		.table({
			status: s.enum('draft', 'live', 'ended').default('draft'),
			audienceSubmissionsOpen: s.boolean().default(false),
			createdById: s.ref('appUsers'),
			startsAt: s.timestamp(),
			endedAt: s.timestamp().optional(),
			createdAt: s.timestamp()
		})
		.index('byStatus', ['status'])
		.index('byStartsAt', ['startsAt']),

	showHosts: s
		.table({
			showId: s.ref('shows'),
			hostId: s.ref('appUsers'),
			displayName: s.string(),
			lowerThirdTitle: s.string().optional(),
			avatarUrl: s.string().optional(),
			position: s.int()
		})
		.index('byShowPosition', ['showId', 'position'])
		.index('byShowHost', ['showId', 'hostId']),

	hostLinks: s
		.table({
			showId: s.ref('shows'),
			showHostId: s.ref('showHosts'),
			url: s.string(),
			title: s.string().optional(),
			notes: s.string().optional(),
			position: s.int()
		})
		.index('byShowHost', ['showId', 'showHostId'])
		.index('byShowPosition', ['showId', 'position']),

	audienceSubmissions: s
		.table({
			showId: s.ref('shows'),
			authorId: s.ref('appUsers'),
			kind: s.enum('post', 'tool'),
			url: s.string(),
			title: s.string().optional(),
			notes: s.string().optional(),
			status: s.enum('pending', 'approved', 'rejected').default('pending'),
			isFeatured: s.boolean().default(false),
			reviewedById: s.ref('appUsers').optional(),
			reviewedAt: s.timestamp().optional(),
			createdAt: s.timestamp(),
			updatedAt: s.timestamp().optional()
		})
		.index('byShowStatus', ['showId', 'status'])
		.index('byShowKindStatus', ['showId', 'kind', 'status'])
		.index('byShowAuthor', ['showId', 'authorId']),

	featuredSubmissionOverlays: s
		.table({
			showId: s.ref('shows'),
			activeSubmissionId: s.ref('audienceSubmissions').optional(),
			updatedById: s.ref('appUsers'),
			updatedAt: s.timestamp()
		})
		.index('byShow', ['showId']),

	lowerThirdOverlays: s
		.table({
			showId: s.ref('shows'),
			activeShowHostId: s.ref('showHosts').optional(),
			updatedById: s.ref('appUsers'),
			updatedAt: s.timestamp()
		})
		.index('byShow', ['showId']),

	submissionVotes: s
		.table({
			showId: s.ref('shows'),
			submissionId: s.ref('audienceSubmissions'),
			voterId: s.ref('appUsers'),
			value: s.int().default(1),
			createdAt: s.timestamp()
		})
		.index('byShow', ['showId'])
		.index('bySubmission', ['submissionId'])
		.index('bySubmissionVoter', ['submissionId', 'voterId'])
		.index('byShowVoter', ['showId', 'voterId']),

	toolCandidates: s
		.table({
			showId: s.ref('shows'),
			source: s.enum('host', 'audience'),
			hostLinkId: s.ref('hostLinks').optional(),
			audienceSubmissionId: s.ref('audienceSubmissions').optional(),
			url: s.string(),
			title: s.string().optional(),
			notes: s.string().optional(),
			position: s.int(),
			lockedAt: s.timestamp().optional()
		})
		.index('byShowPosition', ['showId', 'position'])
		.index('byAudienceSubmission', ['audienceSubmissionId']),

	toolPolls: s
		.table({
			showId: s.ref('shows'),
			pollOpen: s.boolean().default(false),
			audiencePickCandidateId: s.ref('toolCandidates').optional(),
			audiencePickLockedById: s.ref('appUsers').optional(),
			audiencePickLockedAt: s.timestamp().optional(),
			winnerCandidateId: s.ref('toolCandidates').optional(),
			openedAt: s.timestamp().optional(),
			closedAt: s.timestamp().optional()
		})
		.index('byShow', ['showId']),

	toolVotes: s
		.table({
			showId: s.ref('shows'),
			pollId: s.ref('toolPolls'),
			candidateId: s.ref('toolCandidates'),
			voterId: s.ref('appUsers'),
			createdAt: s.timestamp(),
			updatedAt: s.timestamp().optional()
		})
		.index('byPollCandidate', ['pollId', 'candidateId'])
		.index('byShowVoter', ['showId', 'voterId']),

	toolPollResults: s
		.table({
			showId: s.ref('shows'),
			pollId: s.ref('toolPolls'),
			candidateId: s.ref('toolCandidates'),
			voteCount: s.int().default(0),
			isWinner: s.boolean().default(false),
			updatedAt: s.timestamp()
		})
		.index('byPollCandidate', ['pollId', 'candidateId']),

	feudQuestions: s
		.table({
			showId: s.ref('shows'),
			prompt: s.string(),
			phase: s.enum('collecting', 'locked', 'revealing', 'done').default('collecting'),
			collectionOpen: s.boolean().default(false),
			boardSize: s.int().default(6),
			similarityMode: s.enum('strict', 'normal', 'loose').default('normal'),
			randomizedHostIds: s.array(s.ref('appUsers')),
			currentTurnHostId: s.ref('appUsers').optional(),
			createdById: s.ref('appUsers'),
			lockedById: s.ref('appUsers').optional(),
			lockedAt: s.timestamp().optional(),
			completedAt: s.timestamp().optional()
		})
		.index('byShow', ['showId'])
		.index('byPhase', ['phase']),

	feudAnswers: s
		.table({
			showId: s.ref('shows'),
			questionId: s.ref('feudQuestions'),
			authorId: s.ref('appUsers'),
			rawAnswer: s.string(),
			normalizedAnswer: s.string(),
			bucketId: s.ref('feudBuckets').optional(),
			status: s.enum('submitted', 'discarded').default('submitted'),
			createdAt: s.timestamp(),
			updatedAt: s.timestamp().optional()
		})
		.index('byQuestion', ['questionId'])
		.index('byQuestionAuthor', ['questionId', 'authorId']),

	feudBuckets: s
		.table({
			showId: s.ref('shows'),
			questionId: s.ref('feudQuestions'),
			label: s.string(),
			normalizedLabel: s.string(),
			responseCount: s.int().default(0),
			rank: s.int().optional(),
			isBoardBucket: s.boolean().default(false),
			mergedIntoBucketId: s.ref('feudBuckets').optional(),
			createdById: s.ref('appUsers').optional(),
			createdAt: s.timestamp(),
			updatedAt: s.timestamp().optional()
		})
		.index('byQuestionRank', ['questionId', 'rank'])
		.index('byQuestionBoard', ['questionId', 'isBoardBucket']),

	feudBoardSlots: s
		.table({
			showId: s.ref('shows'),
			questionId: s.ref('feudQuestions'),
			slotIndex: s.int(),
			label: s.string().optional(),
			responseCount: s.int().optional(),
			isRevealed: s.boolean().default(false),
			revealedById: s.ref('appUsers').optional(),
			revealedAt: s.timestamp().optional(),
			updatedAt: s.timestamp()
		})
		.index('byQuestionSlot', ['questionId', 'slotIndex']),

	feudStrikes: s
		.table({
			showId: s.ref('shows'),
			questionId: s.ref('feudQuestions'),
			hostId: s.ref('appUsers'),
			count: s.int().default(0),
			updatedAt: s.timestamp().optional()
		})
		.index('byQuestionHost', ['questionId', 'hostId'])
};

type AppSchema = s.Schema<typeof schema>;

export const app: s.App<AppSchema> = s.defineApp(schema);

export type AppUser = s.RowOf<typeof app.appUsers>;
export type Show = s.RowOf<typeof app.shows>;
export type ShowHost = s.RowOf<typeof app.showHosts>;
export type AudienceSubmission = s.RowOf<typeof app.audienceSubmissions>;
export type FeaturedSubmissionOverlay = s.RowOf<typeof app.featuredSubmissionOverlays>;
export type LowerThirdOverlay = s.RowOf<typeof app.lowerThirdOverlays>;
export type SubmissionVote = s.RowOf<typeof app.submissionVotes>;
export type ToolCandidate = s.RowOf<typeof app.toolCandidates>;
export type FeudQuestion = s.RowOf<typeof app.feudQuestions>;
export type FeudBoardSlot = s.RowOf<typeof app.feudBoardSlots>;

export type ShowInsert = s.InsertOf<typeof app.shows>;
export type ShowHostInsert = s.InsertOf<typeof app.showHosts>;
export type AudienceSubmissionInsert = s.InsertOf<typeof app.audienceSubmissions>;
export type FeaturedSubmissionOverlayInsert = s.InsertOf<typeof app.featuredSubmissionOverlays>;
export type LowerThirdOverlayInsert = s.InsertOf<typeof app.lowerThirdOverlays>;
export type SubmissionVoteInsert = s.InsertOf<typeof app.submissionVotes>;
export type FeudQuestionInsert = s.InsertOf<typeof app.feudQuestions>;
