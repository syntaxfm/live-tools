<script lang="ts">
	import { getClientSession } from '$lib/session.svelte';
	import { fetchPageTitle } from '$lib/utils/page-title';
	import type { LiveShowStore } from '$lib/components/shows/room.svelte';
	import SignIn from '../auth/SignIn.svelte';

	let { room }: { room: LiveShowStore } = $props();

	const session = getClientSession();
	const userId = $derived(session.userId);
	const isLoggedIn = $derived(session.isLoggedIn);

	const ownSubmission = $derived(
		room.snapshot?.submissions.find((submission) => submission.authorId === userId) ?? null
	);
	const submissionsOpen = $derived(room.snapshot?.submissionsOpen ?? false);
	const canParticipate = $derived(room.snapshot?.canParticipate ?? false);

	let status = $state<'idle' | 'submitting' | 'submitted'>('idle');
	let error = $state<string | null>(null);
	let isConfirming = $state(false);

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!canParticipate || ownSubmission) {
			return;
		}

		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) {
			error = 'Invalid submission form';
			return;
		}

		const url = (new FormData(form).get('url')?.toString() ?? '').trim();
		if (!url) {
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
			room.send({
				type: 'submission:create',
				kind: 'tool',
				url,
				title: title?.trim() || null,
				notes: null
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

{#if ownSubmission}
	<section class="surface" data-depth="medium">
		<h3>{ownSubmission.title ?? ownSubmission.url}</h3>
		<h4>{ownSubmission.url}</h4>
		<p>
			<span class="badge">{ownSubmission.status}</span>
		</p>
	</section>
{:else if !submissionsOpen}
	<section class="surface" data-depth="medium">
		<p>Submissions are currently closed</p>
	</section>
{:else if !isLoggedIn}
	<section class="surface" data-depth="medium">
		<SignIn />
	</section>
{:else if canParticipate}
	<section class="surface" data-depth="medium">
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
		{#if room.error}
			<p class="status" data-state="warning">{room.error}</p>
		{/if}
	</section>
{:else}
	<section class="surface" data-depth="medium">
		<p>Submissions are currently closed</p>
	</section>
{/if}
