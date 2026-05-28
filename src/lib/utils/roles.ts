// Better Auth stores the user `roles` as a JSON-encoded string[] in D1 (a text column),
// but surfaces it as a parsed string[] on the session. Accept either shape.
export function parseRoles(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter((role): role is string => typeof role === 'string');
	}
	if (typeof value === 'string') {
		try {
			const parsed: unknown = JSON.parse(value);
			return Array.isArray(parsed)
				? parsed.filter((role): role is string => typeof role === 'string')
				: [];
		} catch {
			return [];
		}
	}
	return [];
}

export function hasRole(value: unknown, role: string): boolean {
	return parseRoles(value).includes(role);
}
