export function normalizeGithubUsername(username: string): string {
	return username.trim().replace(/^@/, '').toLowerCase();
}

export function parseGithubUsernameList(value: string | undefined): Set<string> {
	const usernames = value
		?.split(/[\s,]+/)
		.map(normalizeGithubUsername)
		.filter(Boolean);

	return new Set(usernames ?? []);
}
