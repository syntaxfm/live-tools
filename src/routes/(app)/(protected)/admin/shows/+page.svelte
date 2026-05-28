<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatShowDate, formatShowDateInput } from '$lib/utils/shows';

	let { data } = $props();

	const defaultShowDate = formatShowDateInput(new Date());
	let formError = $state<string | null>(null);
</script>

<section class="surface" data-depth="medium">
	<h1>Manage shows</h1>

	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			formError = null;
			return async ({ result, update }) => {
				if (result.type === 'failure' && typeof result.data?.message === 'string') {
					formError = result.data.message;
				}
				await update();
			};
		}}
	>
		<div class="form-row">
			<label class="field">
				Date
				<input name="startsAt" required type="date" value={defaultShowDate} />
			</label>

			<label class="field">
				Status
				<select name="status">
					<option value="draft">Draft</option>
					<option value="live">Live</option>
					<option value="ended">Ended</option>
				</select>
			</label>

			<button type="submit">Create</button>
		</div>

		{#each data.eligibleHosts as host (host.id)}
			<label class="checkbox-field">
				<input checked name="hostId" type="checkbox" value={host.id} />
				{host.name}
			</label>
		{/each}

		{#if formError}
			<p class="status" data-state="warning">{formError}</p>
		{/if}
	</form>
</section>

<section class="surface" data-depth="medium">
	<p class="section-label">Shows</p>

	{#if data.shows.length}
		<ul>
			{#each data.shows as show (show.id)}
				<li>
					<p>
						<a href={resolve(`/admin/shows/${show.id}` as `/admin/shows/${string}`)}>
							{formatShowDate(show.startsAt)}
						</a>
						<span class="badge">{show.status}</span>
					</p>
					<form
						class="inline-actions"
						method="POST"
						action="?/delete"
						use:enhance={({ cancel }) => {
							if (!window.confirm(`Delete ${formatShowDate(show.startsAt)}?`)) {
								cancel();
							}
						}}
					>
						<input name="showId" type="hidden" value={show.id} />
						<button data-variant="danger" type="submit">Delete</button>
					</form>
				</li>
			{/each}
		</ul>
	{:else}
		<h2>No shows</h2>
	{/if}
</section>

<style>
	li {
		list-style: none;
	}
</style>
