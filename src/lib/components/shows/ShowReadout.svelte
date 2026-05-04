<script lang="ts">
	import { resolve } from '$app/paths';

	import { createShowSubscription } from '$lib/components/shows/show-queries.svelte';
	import { formatShowDate, isPublicShowStatus } from '$lib/utils/shows';

	interface Props {
		label: string;
		showId: string | undefined;
		surface: 'admin' | 'host' | 'viewer';
	}

	let { label, showId, surface }: Props = $props();

	const shows = createShowSubscription(() => showId);
	const show = $derived(shows.current?.[0] ?? null);
	const visibleShow = $derived(
		show && (surface !== 'viewer' || isPublicShowStatus(show.status)) ? show : null
	);
	const showDate = $derived(formatShowDate(visibleShow?.startsAt ?? null));
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">{label}</p>

	{#if shows.loading}
		<h1>Show</h1>
		<p class="status" data-state="connecting">Loading show</p>
	{:else if shows.error}
		<h1>Show</h1>
		<p class="status" data-state="warning">{shows.error.message}</p>
	{:else if visibleShow}
		<h1>{showDate}</h1>

		<p>
			<span class="badge">{visibleShow.status}</span>
		</p>

		{#if surface !== 'viewer'}
			<p>
				<a href={resolve(`/show/${visibleShow.id}` as `/show/${string}`)}>Viewer</a>
				<a href={resolve(`/host/shows/${visibleShow.id}` as `/host/shows/${string}`)}>Host</a>
				<a href={resolve(`/admin/shows/${visibleShow.id}` as `/admin/shows/${string}`)}>Admin</a>
			</p>
		{/if}
	{:else}
		<h1>Show</h1>
		<p class="status" data-state="warning">Not found</p>
	{/if}
</section>
