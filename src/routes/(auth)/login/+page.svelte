<script lang="ts">
	import { resolve } from '$app/paths';
	import SignIn from '$lib/components/auth/SignIn.svelte';
	import { getClientSession } from '$lib/session.svelte';

	const session = getClientSession();
	const roleLabel = $derived(session.isAdmin ? 'admin' : 'viewer');
</script>

<section class="surface" data-depth="medium">
	{#if session.claims}
		<h1>Signed in</h1>
		<p>{session.claims.name}</p>
		<p>Role: {roleLabel}</p>
		{#if session.isAdmin}
			<p><a href={resolve('/admin')}>Continue to Admin</a></p>
		{:else}
			<p><a href={resolve('/')}>Continue to App</a></p>
		{/if}
	{:else}
		<h1>Login</h1>
		<SignIn />
	{/if}
</section>
