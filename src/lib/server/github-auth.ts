import { env } from '$env/dynamic/private';

import { app } from '$lib/schema';
import { authJazzContext } from '$lib/server/auth-jazz-context';
import { normalizeGithubUsername, parseGithubUsernameList } from '$lib/utils/github-usernames';

function adminUsernames(): Set<string> {
	return parseGithubUsernameList(env.ADMIN_GITHUB_USERNAMES);
}

export function isAdminGithubUser({ githubUsername }: { githubUsername: string }): boolean {
	return Boolean(adminUsernames().has(normalizeGithubUsername(githubUsername)));
}

export async function resolveGithubUserIdForUser(userId: string): Promise<string | undefined> {
	const startedAt = performance.now();
	console.info('[auth:github-user] resolve github account start', { userId });
	const db = authJazzContext().asBackend(app);
	const githubAccount = await db.one(
		app.better_auth_account.where({ userId, providerId: 'github' }),
		{ tier: 'global' }
	);
	console.info('[auth:github-user] resolve github account complete', {
		userId,
		hasGithubAccount: Boolean(githubAccount),
		elapsedMs: Math.round(performance.now() - startedAt)
	});

	return githubAccount?.accountId;
}
