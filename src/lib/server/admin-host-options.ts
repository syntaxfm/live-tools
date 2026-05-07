import { error } from '@sveltejs/kit';
import type { RowOf } from 'jazz-tools';

import { app } from '$lib/schema';
import type { ShowHostOption } from '$lib/components/shows/show-host-options';
import { authJazzContext } from '$lib/server/auth-jazz-context';
import { isAdminGithubUser, resolveGithubUserIdForUser } from '$lib/server/github-auth';

type BetterAuthUser = RowOf<typeof app.better_auth_user>;
type BetterAuthAccount = RowOf<typeof app.better_auth_account>;

export async function assertAdminUser(userId: string | undefined): Promise<void> {
	if (!userId || !(await isAdminUser(userId))) {
		error(403, 'Admin access required');
	}
}

export async function getAdminHostOptions(): Promise<ShowHostOption[]> {
	const db = authJazzContext().asBackend(app);
	const [appUsers, authUsers, githubAccounts] = await Promise.all([
		db.all(app.appUsers.where({}), { tier: 'global' }),
		db.all(app.better_auth_user.where({}), { tier: 'global' }),
		db.all(app.better_auth_account.where({ providerId: 'github' }), { tier: 'global' })
	]);
	const authUsersById = new Map(authUsers.map((user) => [user.id, user]));
	const githubAccountsByUserId = new Map(
		githubAccounts.map((account) => [account.userId, account])
	);

	return appUsers
		.filter((appUser) => {
			const authUser = authUsersById.get(appUser.externalUserId);
			const githubAccount = githubAccountsByUserId.get(appUser.externalUserId);

			return isAdminGithubUser({
				githubUserId: getGithubUserId(authUser, githubAccount),
				githubUsername: authUser?.githubUsername ?? appUser.githubUsername ?? undefined
			});
		})
		.map((appUser) => ({
			id: appUser.id,
			avatarUrl: appUser.avatarUrl,
			displayName: appUser.displayName
		}))
		.sort((first, second) => first.displayName.localeCompare(second.displayName));
}

export async function getAppUserIdForUserId(userId: string): Promise<string | null> {
	const db = authJazzContext().asBackend(app);
	const appUser = await db.one(app.appUsers.where({ externalUserId: userId }), { tier: 'global' });

	return appUser?.id ?? null;
}

async function isAdminUser(userId: string): Promise<boolean> {
	const db = authJazzContext().asBackend(app);
	const authUser = await db.one(app.better_auth_user.where({ id: userId }), { tier: 'global' });
	const githubUserId = authUser?.githubUserId ?? (await resolveGithubUserIdForUser(userId));

	return isAdminGithubUser({
		githubUserId,
		githubUsername: authUser?.githubUsername ?? undefined
	});
}

function getGithubUserId(
	authUser: BetterAuthUser | undefined,
	githubAccount: BetterAuthAccount | undefined
): string | undefined {
	return authUser?.githubUserId ?? githubAccount?.accountId;
}
