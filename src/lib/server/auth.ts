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
import { authJazzDb } from '$lib/server/auth-jazz-context';
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

const authDb = await authJazzDb();

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [env.ORIGIN],
	database: jazzAdapter({
		db: () => authDb,
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
					await provisionAppUserForGithubAccount(account);
				}
			}
		},
		session: {
			create: {
				after: async (session) => {
					await provisionAppUserForUserId(session.userId);
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
					const githubUserId =
						user.githubUserId ?? (await resolveGithubUserIdForUser(user.id)) ?? undefined;

					return {
						claims: {
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
