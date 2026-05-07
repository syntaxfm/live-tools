<script lang="ts">
	import { getDb, getSession } from 'jazz-tools/svelte';

	import { createTickerMessagesSubscription } from '$lib/components/shows/show-queries.svelte';
	import { addTickerMessage, deleteTickerMessage } from '$lib/components/shows/show-actions';
	import { compareTickerMessagesByPosition } from '$lib/utils/ticker-messages';
	import type { Show } from '$lib/schema';

	let {
		show
	}: {
		show: Show;
	} = $props();

	const db = getDb();
	const session = getSession();

	const messages = createTickerMessagesSubscription(() => show.id);

	const isAdmin = $derived(session?.claims.isAdmin === true);
	const sortedMessages = $derived(
		[...(messages.current ?? [])].sort(compareTickerMessagesByPosition)
	);

	let draftMessage = $state('');
	let pendingActionId = $state<string | null>(null);
	let error = $state<string | null>(null);

	function handleDraftMessageInput(event: Event): void {
		const input = event.currentTarget;

		if (input instanceof HTMLInputElement) {
			draftMessage = input.value;
		}
	}

	async function handleAddMessage(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!session?.user_id || !show.id) {
			error = 'Admin profile required';
			return;
		}

		pendingActionId = 'add';
		error = null;

		try {
			await addTickerMessage({
				createdById: session.user_id,
				db,
				isAdmin,
				messages: sortedMessages,
				showId: show.id,
				text: draftMessage
			});
			draftMessage = '';
		} catch (caughtError) {
			console.error('Unable to add ticker message', caughtError);
			error = 'Unable to add ticker message';
		} finally {
			pendingActionId = null;
		}
	}

	async function handleDeleteMessage(event: Event): Promise<void> {
		const button = event.currentTarget;

		if (!(button instanceof HTMLButtonElement)) {
			error = 'Invalid ticker message control';
			return;
		}

		if (!show.id) {
			error = 'Show required';
			return;
		}

		const message = sortedMessages.find((candidate) => candidate.id === button.dataset.messageId);

		if (!message) {
			error = 'Ticker message not found';
			return;
		}

		pendingActionId = message.id;
		error = null;

		try {
			await deleteTickerMessage({
				db,
				isAdmin,
				message,
				showId: show.id
			});
		} catch (caughtError) {
			console.error('Unable to remove ticker message', caughtError);
			error = 'Unable to remove ticker message';
		} finally {
			pendingActionId = null;
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Ticker</p>

	{#if messages.loading}{:else}
		<form class="ticker-message-form" autocomplete="off" onsubmit={handleAddMessage}>
			<label class="field">
				Message
				<input
					disabled={pendingActionId === 'add'}
					maxlength="240"
					placeholder="New ticker message"
					value={draftMessage}
					oninput={handleDraftMessageInput}
				/>
			</label>

			<button
				data-variant="primary"
				disabled={pendingActionId === 'add' || !draftMessage.trim()}
				type="submit"
			>
				Add
			</button>
		</form>

		{#if sortedMessages.length}
			<ul class="ticker-message-list">
				{#each sortedMessages as message, index (message.id)}
					<li>
						<span class="ticker-message-list__index">{String(index + 1).padStart(2, '0')}</span>
						<span>{message.text}</span>
						<button
							data-message-id={message.id}
							data-variant="danger"
							disabled={pendingActionId === message.id}
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
	{/if}

	{#if error}
		<p class="status" data-state="warning">{error}</p>
	{/if}
</section>
