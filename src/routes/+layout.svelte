<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import JazzAuthProvider from '$lib/components/auth/JazzAuthProvider.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<JazzAuthProvider>
	{@render children()}
</JazzAuthProvider>
