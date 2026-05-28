<script lang="ts">
	import { onMount } from 'svelte';
	import ApprovedSubmissionsList from '$lib/components/shows/ApprovedSubmissionsList.svelte';
	import AudienceSubmissionPanel from '$lib/components/shows/AudienceSubmissionPanel.svelte';
	import { LiveShowStore } from '$lib/components/shows/room.svelte';

	// The live viewer surface. Authenticated socket so a signed-in viewer can submit/vote;
	// follows whichever show is live via the directory DO.
	const room = new LiveShowStore({ authenticated: true });

	onMount(() => {
		room.connect();
		return () => room.close();
	});
</script>

{#if room.snapshot}
	<AudienceSubmissionPanel {room} />
	<ApprovedSubmissionsList {room} />
{/if}
