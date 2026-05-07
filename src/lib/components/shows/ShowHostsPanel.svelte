<script lang="ts">
	import { getDb, getSession, QuerySubscription } from 'jazz-tools/svelte';
	import { assertAdmin } from '$lib/components/shows/show-actions';
	import { app, type Show, type ShowHost } from '$lib/schema';

	let {
		show
	}: {
		show: Show & {
			showHostsViaShow: ShowHost[];
		};
	} = $props();

	const db = getDb();
	const session = getSession();
	const showHosts = $derived(show.showHostsViaShow);
	const all_users = new QuerySubscription(app.appUsers.where({}));
	const admins = $derived(
		all_users?.current
			? all_users.current.filter((user) =>
					['stolinski', 'wesbos', 'w3cj', 'randyrektor'].includes(user.githubUsername ?? '')
				)
			: []
	);

	let isUpdating = $state(false);
	let pendingHostIds = $state<readonly string[] | null>(null);

	const selectedHostIds = $derived(pendingHostIds ?? showHosts.map((host) => host.hostId));
	const isAdmin = $derived(session?.claims.isAdmin) as boolean;

	async function handleHostChange(event: Event): Promise<void> {
		assertAdmin(isAdmin);
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement) || !input.form) {
			return;
		}
		const admin_id = input.value;

		const currentHostsByHostId = new Map(showHosts.map((host) => [host.hostId, host]));
		const host = currentHostsByHostId.get(admin_id);

		const admin = admins.find((a) => a.id === admin_id);

		if (host) {
			db.delete(app.showHosts, host.id);
		} else {
			if (admin) {
				console.log({
					showId: show.id,
					hostId: admin_id,
					displayName: admin.displayName,
					avatarUrl: admin.avatarUrl,
					position: 0
				});
				db.insert(app.showHosts, {
					showId: show.id,
					hostId: admin_id,
					displayName: admin.displayName,
					avatarUrl: admin.avatarUrl,
					position: 0
				});
			}
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Hosts</p>

	<form>
		{#if admins.length}
			<fieldset disabled={isUpdating}>
				<legend>Admins</legend>
				{#each admins as host (host?.id)}
					<label class="checkbox-field">
						<input
							checked={selectedHostIds.includes(host.id)}
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
</section>
