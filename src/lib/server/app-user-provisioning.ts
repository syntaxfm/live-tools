import type { InsertOf, RowOf } from 'jazz-tools';

import { app } from '$lib/schema';
import { authJazzContext } from '$lib/server/auth-jazz-context';
import { getAppUserAvatarUrl, getAppUserDisplayName } from '$lib/utils/app-users';

interface BootstrapGithubAccount {
	accountId: string;
	providerId: string;
	userId: string;
}

type BetterAuthUser = RowOf<typeof app.better_auth_user>;
type AppUserInsert = InsertOf<typeof app.appUsers>;

async function upsertAppUser(
	user: BetterAuthUser,
	githubUsername: string | undefined
): Promise<void> {
	const startedAt = performance.now();
	console.info('[auth:provision:app-user] upsert start', {
		userId: user.id,
		hasGithubUsername: Boolean(githubUsername)
	});
	const db = authJazzContext().asBackend(app);
	console.info('[auth:provision:app-user] query existing app user start', { userId: user.id });
	const existingUser = await db.one(app.appUsers.where({ externalUserId: user.id }), {
		tier: 'global'
	});
	console.info('[auth:provision:app-user] query existing app user complete', {
		userId: user.id,
		existingAppUserId: existingUser?.id ?? null,
		elapsedMs: Math.round(performance.now() - startedAt)
	});
	const appUser: AppUserInsert = {
		externalUserId: user.id,
		githubUsername: githubUsername ?? existingUser?.githubUsername,
		displayName: getAppUserDisplayName(user),
		avatarUrl: getAppUserAvatarUrl(user),
		isBanned: existingUser?.isBanned ?? false
	};

	if (existingUser) {
		console.info('[auth:provision:app-user] update start', {
			userId: user.id,
			appUserId: existingUser.id
		});
		await db.update(app.appUsers, existingUser.id, appUser).wait({ tier: 'global' });
		console.info('[auth:provision:app-user] update complete', {
			userId: user.id,
			appUserId: existingUser.id,
			elapsedMs: Math.round(performance.now() - startedAt)
		});
		return;
	}

	console.info('[auth:provision:app-user] insert start', { userId: user.id });
	const insertedUser = await db.insert(app.appUsers, appUser).wait({ tier: 'global' });
	console.info('[auth:provision:app-user] insert complete', {
		userId: user.id,
		appUserId: insertedUser.id,
		elapsedMs: Math.round(performance.now() - startedAt)
	});
}

export async function provisionAppUserForUserId(userId: string): Promise<void> {
	const startedAt = performance.now();
	console.info('[auth:provision:user] start', { userId });
	const db = authJazzContext().asBackend(app);
	console.info('[auth:provision:user] query better auth user start', { userId });
	const user = await db.one(app.better_auth_user.where({ id: userId }), { tier: 'global' });
	console.info('[auth:provision:user] query better auth user complete', {
		userId,
		foundUser: Boolean(user),
		elapsedMs: Math.round(performance.now() - startedAt)
	});

	if (!user) {
		console.error('Unable to provision app user without Better Auth user', { userId });
		return;
	}

	await upsertAppUser(user, user.githubUsername ?? undefined);
	console.info('[auth:provision:user] complete', {
		userId,
		elapsedMs: Math.round(performance.now() - startedAt)
	});
}

export async function provisionAppUserForGithubAccount(
	account: BootstrapGithubAccount
): Promise<void> {
	if (account.providerId !== 'github') {
		console.info('[auth:provision:github-account] skipped non-github account', {
			providerId: account.providerId,
			userId: account.userId
		});
		return;
	}

	console.info('[auth:provision:github-account] start', { userId: account.userId });
	await provisionAppUserForUserId(account.userId);
	console.info('[auth:provision:github-account] complete', { userId: account.userId });
}
