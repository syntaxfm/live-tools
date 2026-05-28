<script lang="ts">
	import type { ShowRoomStore } from '$lib/components/shows/room.svelte';

	// Reads/writes this show's ticker over the room socket. The page renders this only for
	// admins (server-gated load); the DO independently enforces admin on every write.
	let { room }: { room: ShowRoomStore } = $props();

	let draftMessage = $state('');
	let error = $state<string | null>(null);

	function handleDraftMessageInput(event: Event): void {
		const input = event.currentTarget;
		if (input instanceof HTMLInputElement) {
			draftMessage = input.value;
		}
	}

	function handleAddMessage(event: SubmitEvent): void {
		event.preventDefault();

		const trimmedText = draftMessage.trim();
		if (!trimmedText) {
			error = 'Ticker message required';
			return;
		}

		error = null;
		room.send({ type: 'ticker:add', text: trimmedText });
		draftMessage = '';
	}

	function handleDeleteMessage(event: Event): void {
		const button = event.currentTarget;
		if (button instanceof HTMLButtonElement && button.dataset.messageId) {
			room.send({ type: 'ticker:delete', id: button.dataset.messageId });
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Ticker</p>

	<form class="ticker-message-form" autocomplete="off" onsubmit={handleAddMessage}>
		<label class="field">
			Message
			<input
				maxlength="240"
				placeholder="New ticker message"
				value={draftMessage}
				oninput={handleDraftMessageInput}
			/>
		</label>

		<button data-variant="primary" disabled={!draftMessage.trim()} type="submit">Add</button>
	</form>

	{#if room.snapshot && room.snapshot.ticker.length}
		<ul class="ticker-message-list">
			{#each room.snapshot.ticker as message, index (message.id)}
				<li>
					<span class="ticker-message-list__index">{String(index + 1).padStart(2, '0')}</span>
					<span>{message.text}</span>
					<button
						data-message-id={message.id}
						data-variant="danger"
						type="button"
						onclick={handleDeleteMessage}
					>
						Remove
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<h3>No ticker messages</h3>
	{/if}

	{#if error}
		<p class="status" data-state="warning">{error}</p>
	{/if}
	{#if room.error}
		<p class="status" data-state="warning">{room.error}</p>
	{/if}
</section>
