import { betterAuth } from 'better-auth';
import { jwt } from 'better-auth/plugins/jwt';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { drizzle } from 'drizzle-orm/d1';
import { getRequestEvent } from '$app/server';
import {
	better_auth_user,
	better_auth_session,
	better_auth_account,
	better_auth_verification,
	better_auth_jwks
} from '$lib/server/db/auth-schema';
import { isAdminGithubUser } from '$lib/server/github-auth';

// Per-request factory, not a module-level singleton: on Workers the D1 binding lives on
// `event.platform.env`, which only exists per request. A module-level `auth` would bind
// to no database. Call this in hooks.server.ts with `event.platform.env`.
export function createAuth(env: Env) {
	if (!env.BETTER_AUTH_SECRET) {
		throw new Error('BETTER_AUTH_SECRET is required for Better Auth');
	}

	if (!env.ORIGIN) {
		throw new Error('ORIGIN is required for Better Auth');
	}

	const db = drizzle(env.DB);

	return betterAuth({
		baseURL: env.ORIGIN,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.ORIGIN],
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema: {
				user: better_auth_user,
				session: better_auth_session,
				account: better_auth_account,
				verification: better_auth_verification,
				jwks: better_auth_jwks
			}
		}),
		user: {
			additionalFields: {
				githubUserId: {
					type: 'string',
					required: false,
					input: false
				},
				githubUsername: {
					type: 'string',
					required: false,
					input: false
				},
				banned: {
					type: 'boolean',
					required: false,
					input: false
				},
				roles: {
					type: 'string[]',
					required: false,
					input: false
				}
			}
		},
		account: {
			storeStateStrategy: 'cookie'
		},
		// Email/password exists ONLY for the dev-auth bypass (see
		// docs/adr/0003-dev-only-auth-bypass-for-autonomous-verification.md). Gated on the
		// explicit DEV_AUTH var so no deployed environment ever exposes a password path.
		emailAndPassword: env.DEV_AUTH === '1' ? { enabled: true } : undefined,
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
				overrideUserInfoOnSignIn: true,
				mapProfileToUser: (profile) => {
					let roles = ['viewer'];
					if (
						isAdminGithubUser({
							githubUsername: profile.login
						})
					) {
						roles = [...roles, 'admin', 'host'];
					}
					return {
						githubUsername: profile.login,
						githubUserId: profile.id,
						roles
					};
				}
			}
		},
		plugins: [
			jwt({
				jwks: {
					keyPairConfig: { alg: 'ES256' }
				},
				jwt: {
					issuer: env.ORIGIN,
					definePayload: async ({ user }) => {
						return {
							claims: {
								id: user.id,
								name: user.name,
								email: user.email,
								image: user.image ?? null,
								githubUsername: user.githubUsername ?? null,
								is_admin: user.roles.includes('admin')
							}
						};
					},
					getSubject: ({ user }) => user.id
				}
			}),
			sveltekitCookies(getRequestEvent)
		]
	});
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
