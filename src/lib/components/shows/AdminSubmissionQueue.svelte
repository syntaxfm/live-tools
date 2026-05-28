<script lang="ts">
	import type { SubmissionStatus } from '$lib/components/shows/room-protocol';
	import type { ShowRoomStore } from '$lib/components/shows/room.svelte';
	import { AUDIENCE_SUBMISSION_STATUSES } from '$lib/utils/submissions';

	// Admin moderation. The admin connection's snapshot includes every submission regardless
	// of status; all writes are room messages the DO authorizes as admin.
	let { room }: { room: ShowRoomStore } = $props();

	const submissions = $derived(room.snapshot?.submissions ?? []);
	const hasFeatured = $derived(submissions.some((submission) => submission.isFeatured));

	function moderate(id: string, status: SubmissionStatus): void {
		room.send({ type: 'submission:setStatus', id, status });
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Queue</p>

	{#if submissions.length}
		<ul class="submission-list">
			{#each submissions as submission (submission.id)}
				<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={submission.url} rel="noreferrer" target="_blank">
						{submission.title || submission.url}
					</a>
					<span class="badge">{submission.status}</span>

					<div class="inline-actions">
						{#each AUDIENCE_SUBMISSION_STATUSES as status (status)}
							<button type="button" onclick={() => moderate(submission.id, status)}>{status}</button
							>
						{/each}
						<button
							data-variant="danger"
							type="button"
							onclick={() => room.send({ type: 'submission:delete', id: submission.id })}
						>
							Delete
						</button>
						{#if submission.status === 'approved'}
							<button
								type="button"
								onclick={() => room.send({ type: 'submission:feature', id: submission.id })}
							>
								Feature
							</button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<h3>No submissions</h3>
	{/if}

	{#if hasFeatured}
		<button type="button" onclick={() => room.send({ type: 'submission:clearFeatured' })}>
			Clear featured
		</button>
	{/if}

	{#if room.error}
		<p class="status" data-state="warning">{room.error}</p>
	{/if}
</section>
