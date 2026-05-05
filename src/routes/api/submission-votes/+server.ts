import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { setAudienceSubmissionVoteForUser } from '$lib/components/shows/submission-vote-server-actions';
import { app } from '$lib/schema';
import { authJazzContext } from '$lib/server/auth-jazz-context';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Sign in required' }, { status: 401 });
	}

	const body: unknown = await request.json().catch(() => null);

	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return json({ error: 'Invalid vote request' }, { status: 400 });
	}

	const showId = 'showId' in body ? body.showId : null;
	const submissionId = 'submissionId' in body ? body.submissionId : null;
	const isUpvoted = 'isUpvoted' in body ? body.isUpvoted : null;

	if (
		typeof showId !== 'string' ||
		typeof submissionId !== 'string' ||
		typeof isUpvoted !== 'boolean'
	) {
		return json({ error: 'Invalid vote request' }, { status: 400 });
	}

	try {
		await setAudienceSubmissionVoteForUser({
			db: authJazzContext().asBackend(app),
			isUpvoted,
			showId,
			submissionId,
			userId: locals.user.id
		});

		return json({ ok: true });
	} catch (error) {
		console.error('Unable to set audience submission vote', error);
		return json({ error: 'Unable to vote' }, { status: 403 });
	}
};
