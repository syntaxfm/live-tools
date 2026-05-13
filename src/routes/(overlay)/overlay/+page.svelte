<script lang="ts">
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
	import SubmissionsOverlay from '$lib/components/shows/SubmissionsOverlay.svelte';
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
				activeLowerThirdShowHost: true,
				tickerMessagesViaShow: app.tickerMessages.where({}),
				audienceSubmissionsViaShow: app.audienceSubmissions.where({}).include({
					submissionVotesViaSubmission: app.submissionVotes.where({})
				})
			}),
		{ tier: 'global' }
	);

	const show = $derived(shows.current?.[0]);
</script>

{#if show}
	<div class="overlay-stack">
		<div class="slot slot--lower-third">
			<LowerThirdOverlay {show} />
		</div>
		<div class="slot slot--submissions">
			<SubmissionsOverlay {show} />
		</div>
		<div class="slot slot--ticker">
			<TickerOverlay {show} />
		</div>
	</div>
{/if}

<style>
	.overlay-stack {
		position: absolute;
		inset: 0;
	}

	.slot {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.slot--ticker {
		top: auto;
		height: 140px;
	}

	.slot--lower-third,
	.slot--submissions {
		bottom: 140px;
	}
</style>
