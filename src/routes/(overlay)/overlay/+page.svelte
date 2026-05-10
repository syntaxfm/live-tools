<script>
	import TickerOverlay from '$lib/components/shows/TickerOverlay.svelte';
	import { app } from '$lib/schema';
	import { QuerySubscription } from 'jazz-tools/svelte';

	const shows = new QuerySubscription(
		app.shows
			.where({
				status: 'live'
			})
			.orderBy('startsAt', 'desc')
			.include({
				tickerMessagesViaShow: app.tickerMessages.where({}),
				audienceSubmissionsViaShow: app.audienceSubmissions.where({}).include({
					submissionVotesViaSubmission: app.submissionVotes.where({})
				})
			})
	);
</script>

{#if shows.current?.[0]}
	<TickerOverlay show={shows.current?.[0]} />
{/if}
