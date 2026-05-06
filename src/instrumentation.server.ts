import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://d5f9d63fc06bdce24d0dfc36f3cc33d2@o4507217476845568.ingest.us.sentry.io/4511338880434176',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
