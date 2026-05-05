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
	const db = authJazzContext().asBackend(app);
	const existingUser = await db.one(app.appUsers.where({ externalUserId: user.id }), {
		tier: 'global'
	});
	const appUser: AppUserInsert = {
		externalUserId: user.id,
		githubUsername: githubUsername ?? existingUser?.githubUsername,
		displayName: getAppUserDisplayName(user),
		avatarUrl: getAppUserAvatarUrl(user),
		isBanned: existingUser?.isBanned ?? false
	};

	if (existingUser) {
		await db.update(app.appUsers, existingUser.id, appUser).wait({ tier: 'global' });
		return;
	}

	await db.insert(app.appUsers, appUser).wait({ tier: 'global' });
}

export async function provisionAppUserForUserId(userId: string): Promise<void> {
	const db = authJazzContext().asBackend(app);
	const user = await db.one(app.better_auth_user.where({ id: userId }), { tier: 'global' });

	if (!user) {
		console.error('Unable to provision app user without Better Auth user', { userId });
		return;
	}

	await upsertAppUser(user, user.githubUsername ?? undefined);
}

export async function provisionAppUserForGithubAccount(
	account: BootstrapGithubAccount
): Promise<void> {
	if (account.providerId !== 'github') {
		return;
	}

	await provisionAppUserForUserId(account.userId);
}
