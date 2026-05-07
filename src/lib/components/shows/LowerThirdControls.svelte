<script lang="ts">
	import { getDb, getSession } from 'jazz-tools/svelte';
	import { onDestroy } from 'svelte';

	import {
		broadcastLowerThird,
		clearLowerThird,
		updateShowHostLowerThirdTitle
	} from '$lib/components/shows/show-actions';
	import { getLowerThirdTitle, LOWER_THIRD_DISPLAY_MS } from '$lib/utils/lower-thirds';
	import type { Show, ShowHost } from '$lib/schema';

	let {
		show
	}: {
		show: Show & {
			showHostsViaShow: ShowHost[];
		};
	} = $props();

	const db = getDb();
	const session = getSession();
	const hosts = $derived(show.showHostsViaShow);
	const isAdmin = $derived(session?.claims.isAdmin === true);
	const activeShowHostId = $derived(show?.activeLowerThirdShowHostId ?? null);

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

		try {
			await updateShowHostLowerThirdTitle({
				db,
				host,
				isAdmin,
				showId: show.id,
				title: input.value
			});
		} catch (caughtError) {
			console.error('Unable to update lower third title', caughtError);
			error = 'Unable to update title';
		} finally {
			pendingHostId = null;
		}
	}

	async function handleBroadcast(event: Event): Promise<void> {
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
			await broadcastLowerThird({
				db,
				host,
				isAdmin,
				showId: show.id
			});
			scheduleAutoHide();
		} catch (caughtError) {
			console.error('Unable to broadcast lower third', caughtError);
			error = 'Unable to broadcast';
		} finally {
			pendingHostId = null;
		}
	}

	async function handleClear(): Promise<void> {
		clearAutoHideTimer();
		await clearActiveLowerThird(true);
	}

	async function clearActiveLowerThird(shouldShowPending: boolean): Promise<void> {
		if (!show.id) {
			error = 'Unable to hide lower third';
			return;
		}

		if (shouldShowPending) {
			isClearing = true;
		}
		error = null;

		try {
			await clearLowerThird({
				db,
				isAdmin,
				showId: show.id
			});
		} catch (caughtError) {
			console.error('Unable to hide lower third', caughtError);
			error = 'Unable to hide lower third';
		} finally {
			if (shouldShowPending) {
				isClearing = false;
			}
		}
	}

	function scheduleAutoHide(): void {
		autoHideTimer = setTimeout(() => {
			autoHideTimer = null;
			void clearActiveLowerThird(false);
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
						<button disabled={isClearing} type="button" onclick={handleClear}>Hide</button>
					{:else}
						<button
							data-host-id={host.id}
							disabled={pendingHostId === host.id}
							type="button"
							onclick={handleBroadcast}
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
