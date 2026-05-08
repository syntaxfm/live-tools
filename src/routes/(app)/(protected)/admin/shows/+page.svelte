<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getDb, getSession, QuerySubscription } from 'jazz-tools/svelte';
	import type { PageData } from './$types';

	import { createShow, deleteShow } from '$lib/components/shows/show-actions';
	import {
		compareShowsByRecency,
		formatShowDate,
		formatShowDateInput,
		parseShowDateInput,
		parseShowStatus
	} from '$lib/utils/shows';
	import type { ShowStatus } from '$lib/utils/shows';
	import { app } from '$lib/schema';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const db = getDb();
	const session = getSession();

	const shows = new QuerySubscription(app.shows.where({}));

	const all_users = new QuerySubscription(app.better_auth_user.where({}));

	$inspect(all_users.current);
	const admins = $derived(
		all_users?.current
			? all_users.current.filter((user) =>
					['stolinski', 'wesbos', 'w3cj', 'randyrektor'].includes(user.githubUsername ?? '')
				)
			: []
	);

	$inspect(admins);

	const user = $derived(session?.claims);
	const isAdmin = $derived(user?.isAdmin === true);
	const defaultShowDate = formatShowDateInput(new Date());

	let deleteError = $state<string | null>(null);
	let deletingShowId = $state<string | null>(null);
	let formError = $state<string | null>(null);
	let isCreating = $state(false);

	async function handleCreateShow(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!user || !isAdmin) {
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
		const statusInput = formData.get('status')?.toString();
		const hostIds = formData.getAll('hostIds').map((hostId) => hostId.toString());

		if (!startsAtInput) {
			formError = 'Date required';
			return;
		}

		let status: ShowStatus;

		try {
			status = parseShowStatus(statusInput ?? '');
		} catch (error) {
			console.error('Invalid show status', error);
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
			const show = await createShow({
				createdById: data.currentAppUserId,
				db,
				hosts: hostIds.flatMap((hostId) => {
					const host = hostOptions.find((option) => option.id === hostId);
					return host ? [host] : [];
				}),
				isAdmin,
				startsAt,
				status
			});

			await goto(resolve(`/admin/shows/${show.id}` as `/admin/shows/${string}`));
		} catch (error) {
			console.error('Unable to create show', error);
			formError = 'Unable to create show';
		} finally {
			isCreating = false;
		}
	}

	async function handleDeleteShow(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!isAdmin) {
			deleteError = 'Admin access required';
			return;
		}

		const form = event.currentTarget;

		if (!(form instanceof HTMLFormElement)) {
			deleteError = 'Invalid form';
			return;
		}

		const formData = new FormData(form);
		const showId = formData.get('showId')?.toString();
		const showLabel = formData.get('showLabel')?.toString() ?? 'this show';

		if (!showId) {
			deleteError = 'Show required';
			return;
		}

		if (!window.confirm(`Delete ${showLabel}?`)) {
			return;
		}

		deletingShowId = showId;
		deleteError = null;

		try {
			await deleteShow({
				db,
				isAdmin,
				showId
			});
		} catch (error) {
			console.error('Unable to delete show', error);
			deleteError = error instanceof Error ? error.message : 'Unable to delete show';
		} finally {
			deletingShowId = null;
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Admin</p>
	<h1>Manage shows</h1>

	{#if user && isAdmin}
		<form onsubmit={handleCreateShow}>
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

				<button disabled={isCreating} type="submit">Create</button>
			</div>

			<fieldset>
				<legend>Hosts</legend>
				{#each admins as host (host.id)}
					<label class="checkbox-field">
						<input checked name="hostIds" type="checkbox" value={host.id} />
						{host.displayName}
					</label>
				{/each}
			</fieldset>

			{#if formError}
				<p class="status" data-state="warning">{formError}</p>
			{/if}
		</form>
	{:else}
		<p class="status" data-state="warning">Admin access required</p>
	{/if}
</section>

{#if user && isAdmin}
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
						<p>
							<a href={resolve(`/admin/shows/${show.id}` as `/admin/shows/${string}`)}
								>{formatShowDate(show.startsAt)}</a
							>
							<span class="badge">{show.status}</span>
							<span class="badge">{show.id}</span>
						</p>
						<form class="inline-actions" onsubmit={handleDeleteShow}>
							<input name="showId" type="hidden" value={show.id} />
							<input name="showLabel" type="hidden" value={formatShowDate(show.startsAt)} />
							<button data-variant="danger" disabled={deletingShowId !== null} type="submit">
								{deletingShowId === show.id ? 'Deleting' : 'Delete'}
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<h2>No shows</h2>
		{/if}

		{#if deleteError}
			<p class="status" data-state="warning">{deleteError}</p>
		{/if}
	</section>
{/if}
