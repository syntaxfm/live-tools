<script lang="ts">
	import { getDb, getSession } from 'jazz-tools/svelte';
	import { fetchPageTitle } from '$lib/utils/page-title';
	import { app, type AudienceSubmission, type Show } from '$lib/schema';
	import SignIn from '../auth/SignIn.svelte';

	let {
		show
	}: {
		show: Show & {
			audienceSubmissionsViaShow: AudienceSubmission[];
		};
	} = $props();

	const db = getDb();
	const session = getSession();
	const own_submission = $derived(
		show.audienceSubmissionsViaShow.find((sub) => sub.authorId === session?.user_id)
	);

	let status = $state<'idle' | 'submitting' | 'submitted'>('idle');
	let error = $state<string | null>(null);
	let isConfirming = $state(false);

	const can_edit = $derived(show.status === 'live' && show.audienceSubmissionsOpen);

	const canSubmit = $derived(can_edit && Boolean(session?.user_id));

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!show || !canSubmit || own_submission) {
			return;
		}

		const form = event.currentTarget;

		if (!(form instanceof HTMLFormElement)) {
			error = 'Invalid submission form';
			return;
		}
		if (!session?.user_id) {
			throw new Error('Submission profile required');
		}

		const formData = new FormData(form);
		const url = formData.get('url')?.toString() ?? '';
		const trimmed_url = url.trim();
		if (!trimmed_url) {
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
			const title = await fetchPageTitle(url);
			const trimmed_title = title?.trim();

			db.insert(app.audienceSubmissions, {
				title: trimmed_title,
				url: trimmed_url,
				kind: 'tool',
				authorId: session.user_id,
				createdAt: new Date(),
				showId: show.id
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

{#if own_submission}
	<section class="surface" data-depth="medium">
		<h3>{own_submission.title ?? own_submission.url}</h3>
		<h4>{own_submission.url}</h4>
		<p>
			<span class="badge">{own_submission.status}</span>
		</p>
	</section>
{:else if show.audienceSubmissionsOpen}
	<section class="surface" data-depth="medium">
		{#if session?.authMode === 'external'}
			<form onchange={handleChange} onsubmit={handleSubmit}>
				<label class="field">
					URL
					<input name="url" required type="url" />
				</label>

				<button
					data-variant={isConfirming ? 'danger' : 'primary'}
					disabled={status === 'submitting'}
					type="submit"
				>
					{isConfirming ? 'Are you sure? Submit once' : 'Submit'}
				</button>
			</form>
			{#if error}
				<p class="status" data-state="warning">{error}</p>
			{/if}
		{:else}
			<SignIn />
		{/if}
	</section>
{:else}
	<section class="surface" data-depth="medium">
		<p>Submissions are currently closed</p>
	</section>
{/if}
