<script lang="ts">
	import ApprovedSubmissionsList from '$lib/components/shows/ApprovedSubmissionsList.svelte';
	import AudienceSubmissionPanel from '$lib/components/shows/AudienceSubmissionPanel.svelte';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();
</script>

<AudienceSubmissionPanel {showId} />
<ApprovedSubmissionsList {showId} />
