<script lang="ts">
	import { dev } from '$app/environment';
	import { getDb, getJazzContext, QuerySubscription } from 'jazz-tools/svelte';

	import { createCurrentAppUserSubscription } from '$lib/components/auth/current-app-user.svelte';
	import { saveAudienceSubmission } from '$lib/components/shows/submission-actions';
	import { canEditAudienceSubmission, getLatestAudienceSubmission } from '$lib/utils/submissions';
	import { app } from '$lib/schema';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const db = getDb();
	const jazzContext = getJazzContext();
	const appUsers = createCurrentAppUserSubscription();
	const shows = new QuerySubscription(
		() => (showId ? app.shows.where({ id: showId }) : undefined),
		{ tier: 'global' }
	);
	const appUser = $derived(appUsers.current?.[0] ?? null);

	const ownSubmissions = new QuerySubscription(
		() => (showId ? app.audienceSubmissions.where({ showId, authorId: appUser?.id }) : undefined),
		{ tier: 'global' }
	);

	let status = $state<'idle' | 'submitting' | 'submitted'>('idle');
	let error = $state<string | null>(null);
	let isConfirming = $state(false);

	const show = $derived(shows.current?.[0] ?? null);
	const ownSubmission = $derived(getLatestAudienceSubmission(ownSubmissions.current ?? []));
	const canEdit = $derived(canEditAudienceSubmission(show));
	const session = $derived(jazzContext.session);
	const isDevLocalFirst = $derived(dev && session?.authMode === 'local-first');
	const hasSubmitted = $derived(Boolean(ownSubmission) || status === 'submitted');
	const canSubmit = $derived(canEdit && (Boolean(appUser) || isDevLocalFirst));

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!show || !canSubmit || hasSubmitted) {
			return;
		}

		const form = event.currentTarget;

		if (!(form instanceof HTMLFormElement)) {
			error = 'Invalid submission form';
			return;
		}

		const formData = new FormData(form);
		const url = formData.get('url')?.toString() ?? '';

		if (!url.trim()) {
			return;
		}

		if (!isConfirming) {
			isConfirming = true;
			return;
		}

		status = 'submitting';
		error = null;
		isConfirming = false;

		try {
			if (!session?.user_id) {
				throw new Error('Submission profile required');
			}

			await saveAudienceSubmission({
				appUser,
				db,
				existingSubmission: ownSubmission,
				externalUserId: session.user_id,
				isDevLocalFirst,
				show,
				url
			});

			status = 'submitted';
		} catch (caughtError) {
			console.error('Unable to save audience submission', caughtError);
			error = 'Unable to submit';
			status = 'idle';
		}
	}

	function handleChange(): void {
		isConfirming = false;
	}
</script>

<section class="surface" data-depth="medium">
	{#if ownSubmission}
		<h3>{ownSubmission.title ?? ownSubmission.url}</h3>
		<h4>{ownSubmission.url}</h4>
		<p>
			<span class="badge">{ownSubmission.status}</span>
		</p>
	{:else if canSubmit}
		<form onchange={handleChange} onsubmit={handleSubmit}>
			<label class="field">
				URL
				<input name="url" required type="url" />
			</label>

			<button
				data-variant={isConfirming ? 'danger' : undefined}
				disabled={status === 'submitting'}
				type="submit"
			>
				{isConfirming ? 'Are you sure? Submit once' : 'Submit'}
			</button>
		</form>
	{/if}

	{#if status === 'submitting'}
		<p class="status" data-state="connecting">Submitting</p>
	{/if}

	{#if error}
		<p class="status" data-state="warning">{error}</p>
	{/if}
</section>
