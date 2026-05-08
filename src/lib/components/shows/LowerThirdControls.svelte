<script lang="ts">
	import { getDb } from 'jazz-tools/svelte';
	import { onDestroy } from 'svelte';
	import { getLowerThirdTitle, LOWER_THIRD_DISPLAY_MS } from '$lib/utils/lower-thirds';
	import { app, type Show, type ShowHost } from '$lib/schema';

	let {
		show
	}: {
		show: Show & {
			showHostsViaShow: ShowHost[];
		};
	} = $props();

	const db = getDb();
	const hosts = $derived(show.showHostsViaShow);
	const activeShowHostId = $derived(show?.activeLowerThirdShowHostId ?? null);
	const HIDDEN_LOWER_THIRD_SHOW_HOST_ID = '00000000-0000-4000-8000-000000000001';

	let error = $state<string | null>(null);
	let pendingHostId = $state<string | null>(null);
	let isClearing = $state(false);
	let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

	onDestroy(() => {
		clearAutoHideTimer();
	});

	async function handleTitleChange(event: Event): Promise<void> {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) {
			error = 'Invalid title control';
			return;
		}

		const host = hosts.find((candidate) => candidate.id === input.dataset.hostId);

		if (!show.id || !host) {
			error = 'Host not found';
			return;
		}

		pendingHostId = host.id;
		error = null;

		if (host.showId !== show.id) {
			throw new Error('Host does not belong to show');
		}
		db.update(app.showHosts, host.id, {
			lowerThirdTitle: input.value.trim() || null
		});

		pendingHostId = null;
	}

	async function broadcast(event: Event): Promise<void> {
		const button = event.currentTarget;

		if (!(button instanceof HTMLButtonElement)) {
			error = 'Invalid broadcast control';
			return;
		}
		const host = hosts.find((candidate) => candidate.id === button.dataset.hostId);
		if (!show.id || !host) {
			error = 'Unable to broadcast';
			return;
		}
		pendingHostId = host.id;
		error = null;

		try {
			clearAutoHideTimer();
			db.update(app.shows, show.id, {
				activeLowerThirdShowHostId: host.id
			});
			scheduleAutoHide();
		} catch (caughtError) {
			console.error('Unable to broadcast lower third', caughtError);
			error = 'Unable to broadcast';
		} finally {
			pendingHostId = null;
		}
	}

	async function clearLowerThird(): Promise<void> {
		clearAutoHideTimer();
		db.update(app.shows, show.id, {
			activeLowerThirdShowHostId: HIDDEN_LOWER_THIRD_SHOW_HOST_ID
		});
	}

	function scheduleAutoHide(): void {
		autoHideTimer = setTimeout(() => {
			autoHideTimer = null;
			void clearLowerThird();
		}, LOWER_THIRD_DISPLAY_MS);
	}

	function clearAutoHideTimer(): void {
		if (!autoHideTimer) {
			return;
		}

		clearTimeout(autoHideTimer);
		autoHideTimer = null;
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Lower thirds</p>

	{#if hosts.length}
		<ul class="lower-third-controls">
			{#each hosts as host (host.id)}
				<li data-active={activeShowHostId === host.id}>
					<label class="field">
						{host.displayName}
						<input
							data-host-id={host.id}
							disabled={pendingHostId === host.id}
							placeholder="Title"
							value={getLowerThirdTitle(host)}
							onchange={handleTitleChange}
						/>
					</label>

					{#if activeShowHostId === host.id}
						<button disabled={isClearing} type="button" onclick={clearLowerThird}>Hide</button>
					{:else}
						<button
							data-host-id={host.id}
							disabled={pendingHostId === host.id}
							type="button"
							onclick={broadcast}
						>
							Broadcast
						</button>
					{/if}
				</li>
			{/each}
		</ul>

		{#if error}
			<p class="status" data-state="warning">{error}</p>
		{/if}
	{:else}
		<h2>No hosts</h2>
	{/if}
</section>
