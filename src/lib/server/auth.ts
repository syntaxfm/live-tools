import { betterAuth } from 'better-auth';
import { jwt } from 'better-auth/plugins/jwt';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { jazzAdapter } from 'jazz-tools/better-auth-adapter';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { app } from '$lib/schema';
import { authJazzContext } from '$lib/server/auth-jazz-context';
import { isAdminGithubUser } from '$lib/server/github-auth';

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
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
			overrideUserInfoOnSignIn: true,
			mapProfileToUser: (profile) => {
				console.log('profile', profile.login);
				let roles = ['viewer'];
				if (
					isAdminGithubUser({
						githubUsername: profile.login
					})
				) {
					roles = [...roles, 'admin', 'host'];
				}
				console.log({
					githubUsername: profile.login,
					githubUserId: profile.id,
					roles
				});
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
					console.log('user', user);
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
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
