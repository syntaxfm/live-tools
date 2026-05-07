<script lang="ts">
	import { getDb, getSession } from 'jazz-tools/svelte';
	import { updateShowHosts } from '$lib/components/shows/show-actions';
	import { createShowHostsSubscription } from '$lib/components/shows/show-queries.svelte';
	import { compareShowHostsByPosition } from '$lib/utils/shows';
	import type { Show } from '$lib/schema';

	interface Props {
		show: Show;
	}

	let { show }: Props = $props();

	const db = getDb();
	const session = getSession();

	const showHosts = createShowHostsSubscription(() => show.id);

	let error = $state<string | null>(null);
	let isUpdating = $state(false);
	let pendingHostIds = $state<readonly string[] | null>(null);

	const sortedHosts = $derived([...(showHosts.current ?? [])].sort(compareShowHostsByPosition));
	const selectedHostIds = $derived(pendingHostIds ?? sortedHosts.map((host) => host.hostId));
	const isAdmin = $derived(session?.claims.isAdmin) as boolean;

	function isSelected(hostId: string): boolean {
		return selectedHostIds.includes(hostId);
	}

	async function handleHostChange(event: Event): Promise<void> {
		if (!show) {
			return;
		}

		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement) || !input.form) {
			error = 'Invalid host control';
			return;
		}

		const formData = new FormData(input.form);
		const hostIds = formData.getAll('hostIds').map((hostId) => hostId.toString());
		const selectedHosts = hostIds.flatMap((hostId) => {
			const host = [{}]?.find((option) => option?.id === hostId);
			return host ? [host] : [];
		});

		isUpdating = true;
		pendingHostIds = hostIds;
		error = null;

		try {
			await updateShowHosts({
				activeLowerThirdShowHostId: show.activeLowerThirdShowHostId,
				currentHosts: sortedHosts,
				db,
				hosts: [],
				isAdmin,
				showId: show.id
			});
		} catch (caughtError) {
			console.error('Unable to update show hosts', caughtError);
			error = 'Unable to update hosts';
		} finally {
			isUpdating = false;
			pendingHostIds = null;
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Hosts</p>

	{#if showHosts.error}
		<h2>{showHosts.error.message}</h2>
	{:else if show}
		<form>
			{#if [].length}
				<fieldset disabled={isUpdating}>
					<legend>Admins</legend>
					{#each [] as host (host?.id)}
						<label class="checkbox-field">
							<input
								checked={isSelected(host?.id)}
								name="hostIds"
								type="checkbox"
								value={host?.id}
								onchange={handleHostChange}
							/>
							{host?.displayName}
						</label>
					{/each}
				</fieldset>
			{:else}
				<h2>No admins</h2>
			{/if}
		</form>

		{#if isUpdating}
			<p class="status" data-state="connecting">Updating</p>
		{/if}

		{#if error}
			<p class="status" data-state="warning">{error}</p>
		{/if}
	{:else}
		<h2>Show not found</h2>
	{/if}
</section>
