import * as Sentry from '@sentry/sveltekit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }) {
	return svelteKitHandler({ event, resolve, auth, building });
}

export const handleError = Sentry.handleErrorWithSentry();
