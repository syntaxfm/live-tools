<script lang="ts">
	import { flip } from 'svelte/animate';
	import { getClientSession } from '$lib/session.svelte';
	import type { SubmissionView } from '$lib/components/shows/room-protocol';
	import type { LiveShowStore } from '$lib/components/shows/room.svelte';

	let { room }: { room: LiveShowStore } = $props();

	const session = getClientSession();
	const userId = $derived(session.userId);
	const canParticipate = $derived(room.snapshot?.canParticipate ?? false);
	const approved = $derived(
		(room.snapshot?.submissions ?? []).filter((submission) => submission.status === 'approved')
	);

	function toggleVote(submission: SubmissionView): void {
		if (!canParticipate || submission.authorId === userId) {
			return;
		}
		room.send({ type: 'vote:set', submissionId: submission.id, voted: !submission.hasVoted });
	}
</script>

{#if approved.length}
	<ul class="submission-list">
		{#each approved as submission (submission.id)}
			{@const canVote = canParticipate && submission.authorId !== userId}
			<li animate:flip>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="submission-link" href={submission.url} rel="noreferrer" target="_blank">
					{submission.title || submission.url}
				</a>
				<p class="inline-actions">
					<button
						data-variant={!submission.hasVoted && canVote ? 'primary' : undefined}
						disabled={!canVote}
						type="button"
						onclick={() => toggleVote(submission)}
					>
						<span aria-label={`${submission.voteCount} votes`}>{submission.voteCount}</span>
						{submission.hasVoted ? 'UnVote' : 'Vote'}
					</button>
				</p>
			</li>
		{/each}
	</ul>
{:else}
	<h3>Submissions incoming...</h3>
{/if}

{#if room.error}
	<p class="status" data-state="warning">{room.error}</p>
{/if}

<style>
	.submission-list {
		display: grid;
		margin: 0;
		padding: 0;
		gap: 0.875rem;
		list-style: none;
	}

	.submission-list > li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border-subtle);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-raised-md);
		font-size: 1.1rem;
		font-weight: 500;
	}

	a {
		color: white;
		text-decoration: none;
	}

	.inline-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
