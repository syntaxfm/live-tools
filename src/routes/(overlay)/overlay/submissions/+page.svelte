<script lang="ts">
	import SubmissionsOverlay from '$lib/components/shows/SubmissionsOverlay.svelte';
	import { app } from '$lib/schema';
	import { QuerySubscription } from 'jazz-tools/svelte';

	const shows = new QuerySubscription(
		app.shows
			.where({
				status: 'live'
			})
			.orderBy('startsAt', 'desc')
			.include({
				audienceSubmissionsViaShow: app.audienceSubmissions.where({}).include({
					submissionVotesViaSubmission: app.submissionVotes.where({})
				})
			})
	);
</script>

{#if shows.current?.[0]}
	<SubmissionsOverlay show={shows.current[0]} />
{/if}
