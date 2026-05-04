interface GithubProfile {
	id: number | string;
	login: string;
}

function isGithubProfile(value: unknown): value is GithubProfile {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		(typeof value.id === 'number' || typeof value.id === 'string') &&
		'login' in value &&
		typeof value.login === 'string'
	);
}

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

export function getGithubUserIdFromProfile(value: unknown): string | undefined {
	return isGithubProfile(value) ? normalizeGithubUserId(value.id) : undefined;
}

export function getGithubUsernameFromProfile(value: unknown): string | undefined {
	return isGithubProfile(value) ? normalizeGithubUsername(value.login) : undefined;
}
