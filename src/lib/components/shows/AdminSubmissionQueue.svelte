<script lang="ts">
	import { getDb, getJazzContext } from 'jazz-tools/svelte';

	import { createCurrentAppUserSubscription } from '$lib/components/auth/current-app-user.svelte';
	import {
		clearFeaturedSubmission,
		featureAudienceSubmission,
		moderateAudienceSubmission
	} from '$lib/components/shows/submission-actions';
	import {
		createFeaturedSubmissionOverlaySubscription,
		createShowSubmissionsSubscription
	} from '$lib/components/shows/submission-queries.svelte';
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
	const jazzContext = getJazzContext();
	const appUsers = createCurrentAppUserSubscription();
	const submissions = createShowSubmissionsSubscription(() => showId);
	const featuredOverlays = createFeaturedSubmissionOverlaySubscription(() => showId);
	const appUser = $derived(appUsers.current?.[0] ?? null);
	const isAdmin = $derived(jazzContext.session?.claims.isAdmin === true);
	const sortedSubmissions = $derived(
		[...(submissions.current ?? [])].sort(compareAudienceSubmissionsByNewest)
	);
	const featuredOverlay = $derived(featuredOverlays.current?.[0] ?? null);

	let pendingActionId = $state<string | null>(null);
	let error = $state<string | null>(null);

	async function handleModerate(
		submissionId: string,
		status: AudienceSubmissionStatus
	): Promise<void> {
		if (!appUser || !showId) {
			error = 'Admin profile required';
			return;
		}

		pendingActionId = `${submissionId}:${status}`;
		error = null;

		try {
			await moderateAudienceSubmission({
				appUserId: appUser.id,
				db,
				isAdmin,
				status,
				submissionId
			});

			if (status !== 'approved' && featuredOverlay?.activeSubmissionId === submissionId) {
				await clearFeaturedSubmission({
					appUserId: appUser.id,
					db,
					existingOverlay: featuredOverlay,
					isAdmin,
					showId
				});
			}
		} catch (caughtError) {
			console.error('Unable to moderate submission', caughtError);
			error = 'Unable to moderate submission';
		} finally {
			pendingActionId = null;
		}
	}

	async function handleFeature(submissionId: string): Promise<void> {
		if (!appUser || !showId) {
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
				appUserId: appUser.id,
				db,
				existingOverlay: featuredOverlay,
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
		if (!appUser || !showId) {
			error = 'Admin profile required';
			return;
		}

		pendingActionId = 'clear-featured';
		error = null;

		try {
			await clearFeaturedSubmission({
				appUserId: appUser.id,
				db,
				existingOverlay: featuredOverlay,
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

	{#if submissions.loading}
		<p class="status" data-state="connecting">Loading</p>
	{:else if submissions.error}
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

	{#if featuredOverlay?.activeSubmissionId}
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
