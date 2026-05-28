<script lang="ts">
	interface Props {
		showId: string | undefined;
	}

	// Host prep surface. The route supplies the active show id; the prep content itself is
	// out of scope for the Cloudflare migration (host pages keep their current behavior).
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { showId }: Props = $props();
</script>
