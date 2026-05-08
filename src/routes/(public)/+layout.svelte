<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	let { children } = $props();
</script>

<div class="app-shell">
	<Header />
	<main class="public-main">
		{@render children()}
	</main>
</div>
