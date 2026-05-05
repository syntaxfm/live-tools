<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import JazzAuthProvider from '$lib/components/auth/JazzAuthProvider.svelte';
	import '../app.css';

	let { children } = $props();

	const identityMode = $derived(
		page.url.pathname.startsWith('/overlay') ? 'anonymous-readonly' : 'authenticated-or-local-first'
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#key identityMode}
	<JazzAuthProvider {identityMode}>
		{@render children()}
	</JazzAuthProvider>
{/key}
