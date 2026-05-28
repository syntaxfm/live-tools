import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Better Auth core + plugin tables, hand-authored for the Drizzle / drizzle-orm/d1
// adapter. Column/property names match Better Auth's expected field names (camelCase);
// `roles` is a JSON-encoded string[] (Better Auth serialises array fields to text on
// SQLite). Regenerate the canonical shape with `pnpm auth:schema` if the auth config
// changes. Table names keep the `better_auth_` prefix to match the documented model.

export const better_auth_user = sqliteTable('better_auth_user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
	githubUserId: text('githubUserId'),
	githubUsername: text('githubUsername'),
	banned: integer('banned', { mode: 'boolean' }).default(false),
	roles: text('roles')
});

export const better_auth_session = sqliteTable('better_auth_session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId')
		.notNull()
		.references(() => better_auth_user.id, { onDelete: 'cascade' })
});

export const better_auth_account = sqliteTable('better_auth_account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => better_auth_user.id, { onDelete: 'cascade' }),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const better_auth_verification = sqliteTable('better_auth_verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const better_auth_jwks = sqliteTable('better_auth_jwks', {
	id: text('id').primaryKey(),
	publicKey: text('publicKey').notNull(),
	privateKey: text('privateKey').notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' })
});
