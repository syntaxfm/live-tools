import { betterAuth } from 'better-auth';
import { jwt } from 'better-auth/plugins/jwt';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { jazzAdapter } from 'jazz-tools/better-auth-adapter';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';

import { app } from '$lib/schema';
import {
	provisionAppUserForGithubAccount,
	provisionAppUserForUserId
} from '$lib/server/app-user-provisioning';
import { authJazzContext } from '$lib/server/auth-jazz-context';
import { isAdminGithubUser, resolveGithubUserIdForUser } from '$lib/server/github-auth';
import {
	getGithubUserIdFromProfile,
	getGithubUsernameFromProfile
} from '$lib/utils/github-usernames';

if (!env.BETTER_AUTH_SECRET) {
	throw new Error('BETTER_AUTH_SECRET is required for Better Auth');
}

if (!env.ORIGIN) {
	throw new Error('ORIGIN is required for Better Auth');
}

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [env.ORIGIN],
	database: jazzAdapter({
		db: () => authJazzContext().asBackend(app),
		schema: app.wasmSchema
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
			}
		}
	},
	account: {
		storeStateStrategy: 'cookie'
	},
	databaseHooks: {
		account: {
			create: {
				after: async (account) => {
					const startedAt = performance.now();
					console.info('[auth:hook:account.create] start', {
						providerId: account.providerId,
						userId: account.userId
					});
					await provisionAppUserForGithubAccount(account);
					console.info('[auth:hook:account.create] complete', {
						providerId: account.providerId,
						userId: account.userId,
						elapsedMs: Math.round(performance.now() - startedAt)
					});
				}
			}
		},
		session: {
			create: {
				after: async (session) => {
					const startedAt = performance.now();
					console.info('[auth:hook:session.create] start', {
						userId: session.userId,
						sessionId: session.id
					});
					await provisionAppUserForUserId(session.userId);
					console.info('[auth:hook:session.create] complete', {
						userId: session.userId,
						sessionId: session.id,
						elapsedMs: Math.round(performance.now() - startedAt)
					});
				}
			}
		}
	},

	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
			overrideUserInfoOnSignIn: true,
			mapProfileToUser: (profile) => ({
				githubUserId: getGithubUserIdFromProfile(profile),
				githubUsername: getGithubUsernameFromProfile(profile)
			})
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
					const startedAt = performance.now();
					console.info('[auth:jwt] define payload start', {
						userId: user.id,
						hasGithubUserId: Boolean(user.githubUserId),
						hasGithubUsername: Boolean(user.githubUsername)
					});
					const githubUserId =
						user.githubUserId ?? (await resolveGithubUserIdForUser(user.id)) ?? undefined;
					console.info('[auth:jwt] define payload complete', {
						userId: user.id,
						hasGithubUserId: Boolean(githubUserId),
						elapsedMs: Math.round(performance.now() - startedAt)
					});

					return {
						claims: {
							id: user.id,
							name: user.name,
							email: user.email,
							image: user.image ?? null,
							githubUserId: githubUserId ?? null,
							githubUsername: user.githubUsername ?? null,
							isAdmin: isAdminGithubUser({
								githubUserId,
								githubUsername: user.githubUsername
							})
						}
					};
				},
				getSubject: ({ user }) => user.id
			}
		}),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
