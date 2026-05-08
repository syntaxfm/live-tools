<script lang="ts">
	import { resolve } from '$app/paths';
	import SignIn from '$lib/components/auth/SignIn.svelte';
	import { getSession } from 'jazz-tools/svelte';

	const session = getSession();
	const user = $derived(session?.claims ?? null);
	const roleLabel = $derived(user?.is_admin ? 'admin' : 'viewer');
</script>

<section class="surface" data-depth="medium">
	{#if user?.id}
		<h1>Signed in</h1>
		<p>{user?.displayName ?? session?.user_id}</p>
		<p>Role: {roleLabel}</p>
		{#if user?.is_admin}
			<p><a href={resolve('/admin')}>Continue to Admin</a></p>
		{:else}
			<p><a href={resolve('/')}>Continue to App</a></p>
		{/if}
	{:else}
		<h1>Login</h1>
		<SignIn />
	{/if}
</section>
