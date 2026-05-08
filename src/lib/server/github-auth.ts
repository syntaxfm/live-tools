import { env } from '$env/dynamic/private';
import { normalizeGithubUsername, parseGithubUsernameList } from '$lib/utils/github-usernames';

export function isAdminGithubUser({ githubUsername }: { githubUsername: string }): boolean {
	return Boolean(
		parseGithubUsernameList(env.ADMIN_GITHUB_USERNAMES).has(normalizeGithubUsername(githubUsername))
	);
}
