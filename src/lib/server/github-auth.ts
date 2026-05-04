import { env } from '$env/dynamic/private';

import { app } from '$lib/schema';
import { authJazzContext } from '$lib/server/auth-jazz-context';
import {
	normalizeGithubUsername,
	parseGithubUserIdList,
	parseGithubUsernameList
} from '$lib/utils/github-usernames';

function getAdminGithubUserIds(): Set<string> {
	return parseGithubUserIdList(env.ADMIN_GITHUB_USER_IDS);
}

function getLegacyAdminGithubUsernames(): Set<string> {
	return parseGithubUsernameList(env.ADMIN_GITHUB_USERNAMES);
}

export function isAdminGithubUser({
	githubUserId,
	githubUsername
}: {
	githubUserId: string | undefined;
	githubUsername: string | undefined;
}): boolean {
	if (githubUserId && getAdminGithubUserIds().has(githubUserId)) {
		return true;
	}

	return Boolean(
		!env.ADMIN_GITHUB_USER_IDS &&
		githubUsername &&
		getLegacyAdminGithubUsernames().has(normalizeGithubUsername(githubUsername))
	);
}

export async function resolveGithubUserIdForUser(userId: string): Promise<string | undefined> {
	const db = authJazzContext().asBackend(app);
	const githubAccount = await db.one(
		app.better_auth_account.where({ userId, providerId: 'github' }),
		{ tier: 'global' }
	);

	return githubAccount?.accountId;
}
