import { QuerySubscription } from 'jazz-tools/svelte';
import { app } from '$lib/schema';
import type { AudienceSubmission } from '$lib/schema';

export function createShowApprovedSubmissionsSubscription(
	showId: () => string | undefined
): QuerySubscription<AudienceSubmission> {
	return new QuerySubscription(
		() => {
			const id = showId();
			return id ? app.audienceSubmissions.where({ showId: id, status: 'approved' }) : undefined;
		},
		{ tier: 'global' }
	);
}
