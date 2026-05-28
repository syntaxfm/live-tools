<script lang="ts">
	import '../app.css';
	import { refreshSession } from '$lib/session.svelte';

	let { children } = $props();

	// Establish client identity from the Better Auth JWT before the app renders. CSR-only
	// (ssr = false), so this runs on the client.
	await refreshSession();
</script>

{@render children()}
