import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { provisionAppUserForUserId } from '$lib/server/app-user-provisioning';
import { isAuthPath } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	if (!building && isAuthPath(event.url.toString(), auth.options)) {
		const startedAt = performance.now();
		const pathname = event.url.pathname;
		const requestId = crypto.randomUUID();
		const hasOauthCode = event.url.searchParams.has('code');
		const hasOauthState = event.url.searchParams.has('state');
		const pendingLog = setTimeout(() => {
			console.info(
				`[auth:${requestId}] ${event.request.method} ${pathname} still pending after ${Math.round(
					performance.now() - startedAt
				)}ms`,
				{ hasOauthCode, hasOauthState }
			);
		}, 3000);

		console.info(`[auth:${requestId}] ${event.request.method} ${pathname} start`, {
			hasOauthCode,
			hasOauthState
		});

		try {
			const response = await auth.handler(event.request);
			const location = response.headers.get('location');
			const redirectUrl = location ? new URL(location, event.url.origin) : null;
			console.info(
				`[auth:${requestId}] ${event.request.method} ${pathname} ${response.status} ${Math.round(
					performance.now() - startedAt
				)}ms`,
				{
					redirectHost: redirectUrl?.host ?? null,
					redirectPath: redirectUrl?.pathname ?? null,
					redirectSearchKeys: redirectUrl ? [...redirectUrl.searchParams.keys()] : []
				}
			);
			return response;
		} catch (error) {
			console.error(`[auth:${requestId}] ${event.request.method} ${pathname} failed`, error);
			throw error;
		} finally {
			clearTimeout(pendingLog);
		}
	}

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
		console.info('[auth] existing session resolved', {
			userId: session.user.id,
			sessionId: session.session.id
		});
		provisionAppUserForUserId(session.user.id).catch((error: unknown) => {
			console.error('Unable to provision app user', error);
		});
	}

	return resolve(event);
};

export const handle: Handle = sequence(Sentry.sentryHandle(), handleBetterAuth);
export const handleError = Sentry.handleErrorWithSentry();
