import { redirect, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { createAuth } from '$lib/server/auth';
import { better_auth_user } from '$lib/server/db/auth-schema';
import type { RequestHandler } from './$types';

// Dev-only auth bypass. See docs/adr/0003-dev-only-auth-bypass-for-autonomous-verification.md.
// Establishes a real session (and therefore a real JWKS-signed JWT) for one of two seeded
// identities so the migration can be verified headlessly — an admin and a non-admin viewer.
// Gated on DEV_AUTH=1, which lives only in local .dev.vars and no deployed environment.

const SEED_PASSWORD = 'dev-password-12345';

const SEED_USERS = {
	admin: {
		email: 'dev-admin@example.com',
		name: 'Dev Admin',
		githubUsername: 'dev-admin',
		roles: ['viewer', 'admin', 'host']
	},
	viewer: {
		email: 'dev-viewer@example.com',
		name: 'Dev Viewer',
		githubUsername: 'dev-viewer',
		roles: ['viewer']
	}
} as const;

export const GET: RequestHandler = async (event) => {
	const env = event.platform?.env;
	if (!env || env.DEV_AUTH !== '1') {
		error(404, 'Not found');
	}

	const role = event.url.searchParams.get('role') === 'viewer' ? 'viewer' : 'admin';
	const seed = SEED_USERS[role];
	const auth = event.locals.auth ?? createAuth(env);

	// signUpEmail both creates the user and establishes a session (cookie set via
	// sveltekitCookies). If the seeded user already exists, fall back to signInEmail.
	try {
		await auth.api.signUpEmail({
			body: { email: seed.email, password: SEED_PASSWORD, name: seed.name }
		});
	} catch {
		await auth.api.signInEmail({ body: { email: seed.email, password: SEED_PASSWORD } });
	}

	// roles/githubUsername are input:false, never set through the password path. Force them
	// directly so definePayload derives claims.is_admin correctly when the JWT is minted.
	const db = drizzle(env.DB);
	await db
		.update(better_auth_user)
		.set({
			roles: JSON.stringify(seed.roles),
			githubUsername: seed.githubUsername,
			banned: false
		})
		.where(eq(better_auth_user.email, seed.email));

	redirect(303, event.url.searchParams.get('redirectTo') ?? '/');
};
