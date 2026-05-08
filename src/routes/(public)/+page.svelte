<script lang="ts">
	import ApprovedSubmissionsList from '$lib/components/shows/ApprovedSubmissionsList.svelte';
	import AudienceSubmissionPanel from '$lib/components/shows/AudienceSubmissionPanel.svelte';
	import { app } from '$lib/schema';
	import { QuerySubscription } from 'jazz-tools/svelte';

	const shows = new QuerySubscription(
		app.shows
			.where({
				status: 'live'
			})
			.orderBy('startsAt', 'desc')
			.include({
				audienceSubmissionsViaShow: app.audienceSubmissions.where({})
			})
	);

	$inspect(shows);
</script>

{#if shows.current?.[0]}
	<AudienceSubmissionPanel show={shows.current?.[0]} />
	<ApprovedSubmissionsList showId={shows.current?.[0].id} />
{/if}
