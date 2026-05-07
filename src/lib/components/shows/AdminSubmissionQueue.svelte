<script lang="ts">
	import { getDb, getSession, QuerySubscription } from 'jazz-tools/svelte';
	import {
		clearFeaturedSubmission,
		featureAudienceSubmission,
		moderateAudienceSubmission
	} from '$lib/components/shows/submission-actions';
	import { app } from '$lib/schema';
	import {
		AUDIENCE_SUBMISSION_STATUSES,
		compareAudienceSubmissionsByNewest,
		getAudienceSubmissionTitle
	} from '$lib/utils/submissions';
	import type { AudienceSubmissionStatus } from '$lib/utils/submissions';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const db = getDb();
	const submissions = new QuerySubscription(() =>
		showId ? app.audienceSubmissions.where({ showId }) : undefined
	);
	$inspect(submissions.current);
	const session = getSession();
	const isAdmin = $derived(session?.claims.isAdmin === true);
	const sortedSubmissions = $derived(
		[...(submissions.current ?? [])].sort(compareAudienceSubmissionsByNewest)
	);
	const featuredSubmission = $derived(
		sortedSubmissions.find((submission) => submission.isFeatured) ?? null
	);

	let pendingActionId = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function handleModerate(
		submissionId: string,
		status: AudienceSubmissionStatus
	): Promise<void> {
		if (!session || !showId) {
			error = 'Admin profile required';
			return;
		}

		pendingActionId = `${submissionId}:${status}`;
		error = null;

		try {
			await moderateAudienceSubmission({
				appUserId: session.user_id,
				db,
				isAdmin,
				status,
				submissionId
			});
		} catch (caughtError) {
			console.error('Unable to moderate submission', caughtError);
			error = 'Unable to moderate submission';
		} finally {
			pendingActionId = null;
		}
	}

	async function handleFeature(submissionId: string): Promise<void> {
		if (!session || !showId) {
			error = 'Admin profile required';
			return;
		}

		const submission = sortedSubmissions.find((item) => item.id === submissionId);

		if (!submission) {
			error = 'Submission not found';
			return;
		}

		pendingActionId = `${submissionId}:feature`;
		error = null;

		try {
			await featureAudienceSubmission({
				db,
				isAdmin,
				showId,
				submission
			});
		} catch (caughtError) {
			console.error('Unable to feature submission', caughtError);
			error = 'Unable to feature submission';
		} finally {
			pendingActionId = null;
		}
	}

	async function handleClearFeatured(): Promise<void> {
		if (!session || !showId) {
			error = 'Admin profile required';
			return;
		}

		pendingActionId = 'clear-featured';
		error = null;

		try {
			await clearFeaturedSubmission({
				db,
				isAdmin,
				showId
			});
		} catch (caughtError) {
			console.error('Unable to clear featured submission', caughtError);
			error = 'Unable to clear featured submission';
		} finally {
			pendingActionId = null;
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Queue</p>
	<h2>Submissions</h2>

	{#if submissions.error}
		<p class="status" data-state="warning">{submissions.error.message}</p>
	{:else if sortedSubmissions.length}
		<ul class="submission-list">
			{#each sortedSubmissions as submission (submission.id)}
				<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={submission.url} rel="noreferrer" target="_blank"
						>{getAudienceSubmissionTitle(submission)}</a
					>
					<span class="badge">{submission.status}</span>

					<div class="inline-actions">
						{#each AUDIENCE_SUBMISSION_STATUSES as status (status)}
							<button
								disabled={pendingActionId === `${submission.id}:${status}`}
								type="button"
								onclick={() => handleModerate(submission.id, status)}
							>
								{status}
							</button>
						{/each}

						{#if submission.status === 'approved'}
							<button
								disabled={pendingActionId === `${submission.id}:feature`}
								type="button"
								onclick={() => handleFeature(submission.id)}
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

	{#if featuredSubmission}
		<button
			disabled={pendingActionId === 'clear-featured'}
			type="button"
			onclick={handleClearFeatured}
		>
			Clear featured
		</button>
	{/if}

	{#if error}
		<p class="status" data-state="warning">{error}</p>
	{/if}
</section>
