<script lang="ts">
	import { getDb, getJazzContext } from 'jazz-tools/svelte';

	import { createShowSubscription } from '$lib/components/shows/show-queries.svelte';
	import {
		updateAudienceSubmissionGate,
		updateShowStatus
	} from '$lib/components/shows/show-actions';
	import { formatShowDate, parseShowStatus, SHOW_STATUSES } from '$lib/utils/shows';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const db = getDb();
	const jazzContext = getJazzContext();
	const shows = createShowSubscription(() => showId);
	const show = $derived(shows.current?.[0] ?? null);
	const isAdmin = $derived(jazzContext.session?.claims.isAdmin === true);
	const showDate = $derived(formatShowDate(show?.startsAt ?? null));

	let error = $state<string | null>(null);
	let pendingControl = $state<'status' | 'submissions' | null>(null);

	async function handleStatusChange(event: Event): Promise<void> {
		if (!show) {
			return;
		}

		const select = event.currentTarget;

		if (!(select instanceof HTMLSelectElement)) {
			error = 'Invalid status control';
			return;
		}

		pendingControl = 'status';
		error = null;

		try {
			await updateShowStatus({
				db,
				isAdmin,
				showId: show.id,
				status: parseShowStatus(select.value)
			});
		} catch (caughtError) {
			console.error('Unable to update show status', caughtError);
			error = 'Unable to update show status';
		} finally {
			pendingControl = null;
		}
	}

	async function handleAudienceSubmissionsChange(event: Event): Promise<void> {
		if (!show) {
			return;
		}

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
				isAdmin,
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
	<p class="section-label">State</p>

	{#if shows.loading}
		<h2>Loading</h2>
	{:else if shows.error}
		<h2>{shows.error.message}</h2>
	{:else if show}
		<h2>{showDate}</h2>

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
	{:else}
		<h2>Show not found</h2>
	{/if}
</section>
