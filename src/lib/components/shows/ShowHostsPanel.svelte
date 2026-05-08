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
	const active_hosts = $derived(show.showHostsViaShow);
	const hosts = new QuerySubscription(app.better_auth_user.where({ roles: { contains: 'host' } }));

	let isUpdating = $state(false);
	let pendingHostIds = $state<readonly string[] | null>(null);

	const selectedHostIds = $derived(pendingHostIds ?? active_hosts.map((host) => host.hostId));
	const is_admin = $derived(session?.claims.is_admin) as boolean;

	async function handleHostChange(event: Event): Promise<void> {
		assertAdmin(is_admin);
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement) || !input.form) {
			return;
		}
		const admin_id = input.value;
		const currentHostsByHostId = new Map(active_hosts.map((host) => [host.hostId, host]));
		const host = currentHostsByHostId.get(admin_id);
		const admin = hosts?.current?.find((a) => a.id === admin_id);

		if (host) {
			db.delete(app.showHosts, host.id);
		} else {
			if (admin) {
				db.insert(app.showHosts, {
					showId: show.id,
					hostId: admin_id,
					displayName: admin.name
				});
			}
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Hosts</p>

	<form>
		<fieldset disabled={isUpdating}>
			<legend>Hosts</legend>
			{#each hosts.current as host (host?.id)}
				<label class="checkbox-field">
					<input
						checked={selectedHostIds.includes(host.id)}
						name="hostIds"
						type="checkbox"
						value={host?.id}
						onchange={handleHostChange}
					/>
					{host?.name}
				</label>
			{/each}
		</fieldset>
	</form>
</section>
