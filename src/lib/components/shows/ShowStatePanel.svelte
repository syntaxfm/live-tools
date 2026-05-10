<script lang="ts">
	import { getDb, getSession } from 'jazz-tools/svelte';
	import { assertAdmin, updateAudienceSubmissionGate } from '$lib/components/shows/show-actions';
	import { formatShowDate, parseShowStatus, SHOW_STATUSES } from '$lib/utils/shows';
	import { app, type Show } from '$lib/schema';

	let {
		show
	}: {
		show: Show;
	} = $props();

	const db = getDb();
	const session = getSession();
	const is_admin = $derived(session?.claims.is_admin) as boolean;

	let error = $state<string | null>(null);
	let pendingControl = $state<'status' | 'submissions' | null>(null);

	async function handleStatusChange(event: Event): Promise<void> {
		assertAdmin(is_admin);

		const select = event.currentTarget;

		if (!(select instanceof HTMLSelectElement)) {
			error = 'Invalid status control';
			return;
		}

		pendingControl = 'status';
		error = null;

		try {
			const status = parseShowStatus(select.value);
			await db
				.update(app.shows, show.id, {
					status,
					endedAt: status === 'ended' ? new Date() : null
				})
				.wait({ tier: 'global' });
		} catch (caughtError) {
			console.error('Unable to update show status', caughtError);
			error = 'Unable to update show status';
		} finally {
			pendingControl = null;
		}
	}

	async function handleAudienceSubmissionsChange(event: Event): Promise<void> {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			error = 'Invalid submissions control';
			return;
		}

		pendingControl = 'submissions';
		error = null;

		try {
			await updateAudienceSubmissionGate({
				db,
				is_admin,
				isOpen: input.checked,
				showId: show.id
			});
		} catch (caughtError) {
			console.error('Unable to update audience submissions', caughtError);
			error = 'Unable to update submissions';
		} finally {
			pendingControl = null;
		}
	}
</script>

<section class="surface" data-depth="medium">
	<h2>{formatShowDate(show.startsAt)}</h2>

	<div class="form-row">
		<label class="field">
			Status
			<select
				disabled={pendingControl === 'status'}
				value={show.status}
				onchange={handleStatusChange}
			>
				{#each SHOW_STATUSES as status (status)}
					<option value={status}>{status}</option>
				{/each}
			</select>
		</label>

		<label class="checkbox-field">
			<input
				checked={show.audienceSubmissionsOpen}
				disabled={pendingControl === 'submissions'}
				type="checkbox"
				onchange={handleAudienceSubmissionsChange}
			/>
			Audience submissions
		</label>
	</div>

	{#if show.endedAt}
		<p class="status" data-state="success">Ended {formatShowDate(show.endedAt)}</p>
	{/if}

	{#if error}
		<p class="status" data-state="warning">{error}</p>
	{/if}
</section>
