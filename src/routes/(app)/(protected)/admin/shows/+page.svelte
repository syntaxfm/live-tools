<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getDb, getJazzContext } from 'jazz-tools/svelte';

	import {
		createAppUsersSubscription,
		createCurrentAppUserSubscription
	} from '$lib/components/auth/current-app-user.svelte';
	import { createShowsSubscription } from '$lib/components/shows/show-queries.svelte';
	import { app } from '$lib/schema';
	import {
		compareShowsByRecency,
		formatShowDate,
		formatShowDateInput,
		parseShowDateInput
	} from '$lib/utils/shows';
	import type { ShowStatus } from '$lib/utils/shows';

	const db = getDb();
	const jazzContext = getJazzContext();
	const appUsers = createCurrentAppUserSubscription();
	const allAppUsers = createAppUsersSubscription();
	const shows = createShowsSubscription();
	const appUser = $derived(appUsers.current?.[0] ?? null);
	const sortedShows = $derived([...(shows.current ?? [])].sort(compareShowsByRecency));
	const hostOptions = $derived(
		[...(allAppUsers.current ?? [])].sort((first, second) =>
			first.displayName.localeCompare(second.displayName)
		)
	);
	const isAdmin = $derived(jazzContext.session?.claims.isAdmin === true);
	const defaultShowDate = formatShowDateInput(new Date());

	let formError = $state<string | null>(null);
	let isCreating = $state(false);

	async function handleCreateShow(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!appUser || !isAdmin) {
			formError = 'Admin access required';
			return;
		}

		const form = event.currentTarget;

		if (!(form instanceof HTMLFormElement)) {
			formError = 'Invalid form';
			return;
		}

		const formData = new FormData(form);
		const startsAtInput = formData.get('startsAt')?.toString();
		const status = formData.get('status')?.toString() as ShowStatus | undefined;
		const hostIds = formData.getAll('hostIds').map((hostId) => hostId.toString());

		if (!startsAtInput) {
			formError = 'Date required';
			return;
		}

		if (status !== 'draft' && status !== 'live' && status !== 'ended') {
			formError = 'Invalid status';
			return;
		}

		let startsAt: Date;

		try {
			startsAt = parseShowDateInput(startsAtInput);
		} catch (error) {
			console.error('Invalid show date', error);
			formError = 'Invalid date';
			return;
		}

		isCreating = true;
		formError = null;

		try {
			const show = await db
				.insert(app.shows, {
					status,
					audienceSubmissionsOpen: false,
					createdById: appUser.id,
					startsAt,
					createdAt: new Date()
				})
				.wait({ tier: 'global' });

			await Promise.all(
				hostIds
					.flatMap((hostId) => {
						const host = hostOptions.find((option) => option.id === hostId);
						return host ? [host] : [];
					})
					.map((host, position) =>
						db
							.insert(app.showHosts, {
								showId: show.id,
								hostId: host.id,
								displayName: host.displayName,
								avatarUrl: host.avatarUrl,
								position
							})
							.wait({ tier: 'global' })
					)
			);

			await goto(resolve(`/admin/shows/${show.id}` as `/admin/shows/${string}`));
		} catch (error) {
			console.error('Unable to create show', error);
			formError = 'Unable to create show';
		} finally {
			isCreating = false;
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Admin</p>
	<h1>Shows</h1>

	{#if appUsers.loading}
		<p class="status" data-state="connecting">Loading profile</p>
	{:else if appUser && isAdmin}
		<form onsubmit={handleCreateShow}>
			<label>
				Date
				<input name="startsAt" required type="date" value={defaultShowDate} />
			</label>

			<label>
				Status
				<select name="status">
					<option value="draft">Draft</option>
					<option value="live">Live</option>
					<option value="ended">Ended</option>
				</select>
			</label>

			{#if allAppUsers.loading}
				<p class="status" data-state="connecting">Loading hosts</p>
			{:else if allAppUsers.error}
				<p class="status" data-state="warning">{allAppUsers.error.message}</p>
			{:else if hostOptions.length}
				<fieldset>
					<legend>Hosts</legend>
					{#each hostOptions as host (host.id)}
						<label>
							<input checked name="hostIds" type="checkbox" value={host.id} />
							{host.displayName}
						</label>
					{/each}
				</fieldset>
			{/if}

			<button disabled={isCreating} type="submit">Create</button>

			{#if formError}
				<p class="status" data-state="warning">{formError}</p>
			{/if}
		</form>
	{:else}
		<p class="status" data-state="warning">Admin access required</p>
	{/if}
</section>

{#if appUser && isAdmin}
	<section class="surface" data-depth="medium">
		<p class="section-label">Shows</p>

		{#if shows.loading}
			<h2>Loading</h2>
		{:else if shows.error}
			<h2>{shows.error.message}</h2>
		{:else if sortedShows.length}
			<ul>
				{#each sortedShows as show (show.id)}
					<li>
						<a href={resolve(`/admin/shows/${show.id}` as `/admin/shows/${string}`)}
							>{formatShowDate(show.startsAt)}</a
						>
						<span class="badge">{show.status}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<h2>No shows</h2>
		{/if}
	</section>
{/if}
