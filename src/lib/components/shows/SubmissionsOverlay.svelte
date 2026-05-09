<script lang="ts">
	import { type AudienceSubmission, type Show, type SubmissionVote } from '$lib/schema';
	import { flip } from 'svelte/animate';
	let {
		show
	}: {
		show: Show & {
			audienceSubmissionsViaShow: (AudienceSubmission & {
				submissionVotesViaSubmission: SubmissionVote[];
			})[];
		};
	} = $props();
	const submissions = $derived(show.audienceSubmissionsViaShow);
</script>

{#if submissions.length > 0}
	<section class="submissions-overlay" aria-label="Submissions">
		<ol class="submissions-overlay__list">
			{#each submissions as submission (submission.id)}
				{@const vote_count = submission?.submissionVotesViaSubmission?.length}
				<li animate:flip class="submissions-overlay__item">
					<span class="vote" aria-label={`${vote_count} votes`}>{vote_count}</span>
					<h1>{submission.title || submission.url}</h1>
				</li>
			{/each}
		</ol>
	</section>
{/if}

<style>
	.submissions-overlay {
		position: absolute;
		right: 64px;
		bottom: 64px;
		display: grid;
		width: min(890px, calc(100% - 18px));
		gap: 16px;
	}

	.submissions-overlay__list {
		display: grid;
		margin: 0;
		padding: 0;
		gap: 12px;
		list-style: none;
	}

	.submissions-overlay__item {
		display: grid;
		grid-template-columns: 100px minmax(0, 1fr) max-content;
		align-items: center;
		gap: 10px;
		min-height: 108px;
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-raised-lg);
		contain: layout;
		overflow: hidden;
	}

	.submissions-overlay__item > h1 {
		overflow: hidden;
		padding: 18px 22px;
		color: var(--color-text);
		font-size: 34px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.vote {
		padding: 0 40px;
		color: var(--color-ink);
		box-shadow: 2px 0 0 0 var(--color-ink);
		background: var(--color-accent);
		font-size: 42px;
		justify-content: center;
		border-right: var(--border-width) solid var(--color-ink);
		display: flex;
		align-items: center;
		height: 100%;
		font-size: 3.2rem;
		font-weight: 700;
	}
</style>
