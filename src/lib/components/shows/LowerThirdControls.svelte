<script lang="ts">
	import { getDb, getSession } from 'jazz-tools/svelte';
	import { onDestroy } from 'svelte';

	import {
		createShowHostsSubscription,
		createShowSubscription
	} from '$lib/components/shows/show-queries.svelte';
	import {
		broadcastLowerThird,
		clearLowerThird,
		updateShowHostLowerThirdTitle
	} from '$lib/components/shows/show-actions';
	import { getLowerThirdTitle, LOWER_THIRD_DISPLAY_MS } from '$lib/utils/lower-thirds';
	import { compareShowHostsByPosition } from '$lib/utils/shows';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const db = getDb();
	const session = getSession();

	const unsubscribeMutationError = db.onMutationError((event) => {
		console.error('[jazz:mutation-error]', event);
	});
	const shows = createShowSubscription(() => showId);
	const hosts = createShowHostsSubscription(() => showId);
	const show = $derived(shows.current?.[0] ?? null);
	const sortedHosts = $derived([...(hosts.current ?? [])].sort(compareShowHostsByPosition));
	const isAdmin = $derived(session?.claims.isAdmin === true);
	const activeShowHostId = $derived(show?.activeLowerThirdShowHostId ?? null);

	let error = $state<string | null>(null);
	let pendingHostId = $state<string | null>(null);
	let isClearing = $state(false);
	let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

	onDestroy(() => {
		clearAutoHideTimer();
		unsubscribeMutationError();
	});

	async function handleTitleChange(event: Event): Promise<void> {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			error = 'Invalid title control';
			return;
		}

		const host = sortedHosts.find((candidate) => candidate.id === input.dataset.hostId);

		if (!showId || !host) {
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
				showId,
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

		const host = sortedHosts.find((candidate) => candidate.id === button.dataset.hostId);

		if (!showId || !host) {
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
				showId
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
		if (!showId) {
			error = 'Unable to hide lower third';
			return;
		}

		if (shouldShowPending) {
			isClearing = true;
		}
		error = null;

		console.log('hiding lower third for show', showId);
		try {
			await clearLowerThird({
				db,
				isAdmin,
				showId
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

	{#if hosts.loading || shows.loading}
		<h2>Loading</h2>
	{:else if shows.error}
		<h2>{shows.error.message}</h2>
	{:else if hosts.error}
		<h2>{hosts.error.message}</h2>
	{:else if sortedHosts.length}
		<ul class="lower-third-controls">
			{#each sortedHosts as host (host.id)}
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
