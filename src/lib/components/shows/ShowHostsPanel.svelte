<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ShowHost } from '$lib/components/shows/registry-types';

	// Host assignment is registry data. Toggling a checkbox submits the full set of selected
	// hosts to the ?/assignHosts form action, which diffs against the current rows.
	let {
		hosts,
		eligibleHosts
	}: { hosts: ShowHost[]; eligibleHosts: { id: string; name: string }[] } = $props();

	const selectedHostIds = $derived(new Set(hosts.map((host) => host.hostId)));

	function submitOnChange(event: Event): void {
		const input = event.currentTarget;
		if (input instanceof HTMLInputElement) {
			input.form?.requestSubmit();
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Hosts</p>

	<form method="POST" action="?/assignHosts" use:enhance>
		{#each eligibleHosts as host (host.id)}
			<label class="checkbox-field">
				<input
					type="checkbox"
					name="hostId"
					value={host.id}
					checked={selectedHostIds.has(host.id)}
					onchange={submitOnChange}
				/>
				{host.name}
			</label>
		{/each}
	</form>
</section>
