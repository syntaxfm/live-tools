export function normalizeGithubUserId(userId: string | number): string {
	return String(userId).trim();
}

export function normalizeGithubUsername(username: string): string {
	return username.trim().replace(/^@/, '').toLowerCase();
}

export function parseGithubUserIdList(value: string | undefined): Set<string> {
	const userIds = value
		?.split(/[\s,]+/)
		.map(normalizeGithubUserId)
		.filter(Boolean);

	return new Set(userIds ?? []);
}

export function parseGithubUsernameList(value: string | undefined): Set<string> {
	const usernames = value
		?.split(/[\s,]+/)
		.map(normalizeGithubUsername)
		.filter(Boolean);

	return new Set(usernames ?? []);
}
