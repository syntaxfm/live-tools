import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { better_auth_user } from '$lib/server/db/auth-schema';

// Durable, cross-cutting registry data (the list admins browse, show metadata, host
// assignments and their links). Lives in D1. Live "room state" (ticker, lower-third,
// submissions, votes, featured, the submissions-open gate) is NOT here — it lives in
// the per-show ShowRoom Durable Object.

export const shows = sqliteTable(
	'shows',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		status: text('status', { enum: ['draft', 'live', 'ended'] })
			.notNull()
			.default('draft'),
		startsAt: integer('startsAt', { mode: 'timestamp' }).notNull(),
		endedAt: integer('endedAt', { mode: 'timestamp' }),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		createdById: text('createdById')
			.notNull()
			.references(() => better_auth_user.id)
	},
	(table) => [
		index('shows_by_status').on(table.status),
		index('shows_by_starts_at').on(table.startsAt),
		// Enforces "at most one show live" atomically in D1: every qualifying row shares
		// status='live', so a unique index over those rows permits exactly one.
		uniqueIndex('shows_one_live')
			.on(table.status)
			.where(sql`${table.status} = 'live'`)
	]
);

export const showHosts = sqliteTable(
	'showHosts',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		showId: text('showId')
			.notNull()
			.references(() => shows.id, { onDelete: 'cascade' }),
		hostId: text('hostId')
			.notNull()
			.references(() => better_auth_user.id),
		displayName: text('displayName').notNull(),
		lowerThirdTitle: text('lowerThirdTitle')
	},
	(table) => [index('show_hosts_by_show_host').on(table.showId, table.hostId)]
);

export const hostLinks = sqliteTable(
	'hostLinks',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		showId: text('showId')
			.notNull()
			.references(() => shows.id, { onDelete: 'cascade' }),
		showHostId: text('showHostId')
			.notNull()
			.references(() => showHosts.id, { onDelete: 'cascade' }),
		url: text('url').notNull(),
		title: text('title'),
		notes: text('notes')
	},
	(table) => [index('host_links_by_show_host').on(table.showId, table.showHostId)]
);
