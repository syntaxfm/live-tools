<script lang="ts">
	import { enhance } from '$app/forms';
	import { getLowerThirdTitle } from '$lib/utils/lower-thirds';
	import type { ShowHost } from '$lib/components/shows/registry-types';
	import type { ShowRoomStore } from '$lib/components/shows/room.svelte';

	// `hosts` is registry data (the show's assigned hosts + their titles), edited via a form
	// action. Which host is on-air is live room state; broadcast/hide are room messages and
	// the DO auto-hides after LOWER_THIRD_DISPLAY_MS via an Alarm.
	let { hosts, room }: { hosts: ShowHost[]; room: ShowRoomStore } = $props();

	const activeShowHostId = $derived(room.snapshot?.lowerThird?.showHostId ?? null);

	function submitOnChange(event: Event): void {
		const input = event.currentTarget;
		if (input instanceof HTMLInputElement) {
			input.form?.requestSubmit();
		}
	}

	function broadcast(showHostId: string): void {
		room.send({ type: 'lowerThird:broadcast', showHostId });
	}

	function hide(): void {
		room.send({ type: 'lowerThird:hide' });
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Lower thirds</p>

	{#if hosts.length}
		<ul class="lower-third-controls">
			{#each hosts as host (host.id)}
				<li data-active={activeShowHostId === host.id}>
					<form method="POST" action="?/updateHostTitle" use:enhance>
						<input type="hidden" name="showHostId" value={host.id} />
						<label class="field">
							{host.displayName}
							<input
								name="title"
								placeholder="Title"
								value={getLowerThirdTitle({
									showHostId: host.id,
									displayName: host.displayName,
									lowerThirdTitle: host.lowerThirdTitle
								})}
								onchange={submitOnChange}
							/>
						</label>
					</form>

					{#if activeShowHostId === host.id}
						<button type="button" onclick={hide}>Hide</button>
					{:else}
						<button type="button" onclick={() => broadcast(host.id)}>Broadcast</button>
					{/if}
				</li>
			{/each}
		</ul>

		{#if room.error}
			<p class="status" data-state="warning">{room.error}</p>
		{/if}
	{:else}
		<h2>No hosts</h2>
	{/if}
</section>

<style>
	.lower-third-controls {
		display: grid;
		margin: 0 0 0.875rem;
		padding: 0;
		gap: 0.75rem;
		list-style: none;
	}

	.lower-third-controls > li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) max-content;
		gap: 0.75rem;
		align-items: end;
	}

	.lower-third-controls > li[data-active='true'] {
		border-color: var(--color-accent);
	}
</style>
