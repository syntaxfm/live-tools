import * as Sentry from '@sentry/cloudflare';
import { building } from '$app/environment';
import { createAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (building || !event.platform?.env) {
		return resolve(event);
	}

	const auth = createAuth(event.platform.env);
	event.locals.auth = auth;

	const sessionData = await auth.api.getSession({ headers: event.request.headers });
	if (sessionData) {
		event.locals.user = sessionData.user;
		event.locals.session = sessionData.session;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handleError: HandleServerError = ({ error, status }) => {
	if (status !== 404) {
		Sentry.captureException(error);
	}
};
