import { error } from '@sveltejs/kit';

// Server-side admin gate for registry form actions and admin-only loads. The authoritative
// check is the user's `roles` (from the Better Auth user row, surfaced on the session). UI
// affordances gate on the JWT claim; writes gate here.
export function requireAdmin(locals: App.Locals): NonNullable<App.Locals['user']> {
	const user = locals.user;
	const roles = Array.isArray(user?.roles) ? user.roles : [];
	if (!user || !roles.includes('admin')) {
		error(403, 'Admin access required');
	}
	return user;
}
