<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatShowDate, SHOW_STATUSES } from '$lib/utils/shows';
	import type { Show } from '$lib/components/shows/registry-types';
	import type { ShowRoomStore } from '$lib/components/shows/room.svelte';

	// `show` is registry metadata (status, dates) edited via a form action; the
	// submissions-open gate is live room state toggled over the room socket.
	let { show, room }: { show: Show; room: ShowRoomStore } = $props();

	let error = $state<string | null>(null);
	let pending = $state(false);

	function submitOnChange(event: Event): void {
		const select = event.currentTarget;
		if (select instanceof HTMLSelectElement) {
			select.form?.requestSubmit();
		}
	}

	function handleSubmissionsChange(event: Event): void {
		const input = event.currentTarget;
		if (input instanceof HTMLInputElement) {
			room.send({ type: 'submissions:setOpen', open: input.checked });
		}
	}
</script>

<section class="surface" data-depth="medium">
	<h2>{formatShowDate(show.startsAt)}</h2>

	<form
		method="POST"
		action="?/status"
		use:enhance={() => {
			pending = true;
			error = null;
			return async ({ result, update }) => {
				pending = false;
				if (result.type === 'failure' && typeof result.data?.message === 'string') {
					error = result.data.message;
				}
				await update();
			};
		}}
	>
		<label class="field">
			Status
			<select name="status" value={show.status} disabled={pending} onchange={submitOnChange}>
				{#each SHOW_STATUSES as status (status)}
					<option value={status}>{status}</option>
				{/each}
			</select>
		</label>
	</form>

	<label class="checkbox-field">
		<input
			type="checkbox"
			checked={room.snapshot?.submissionsOpen ?? false}
			onchange={handleSubmissionsChange}
		/>
		Audience submissions
	</label>

	{#if show.endedAt}
		<p class="status" data-state="success">Ended {formatShowDate(show.endedAt)}</p>
	{/if}

	{#if error}
		<p class="status" data-state="warning">{error}</p>
	{/if}
</section>
