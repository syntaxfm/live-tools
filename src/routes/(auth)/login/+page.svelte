<script lang="ts">
	import { resolve } from '$app/paths';
	import { getSession } from 'jazz-tools/svelte';
	import { authClient } from '$lib/auth-client';

	const session = getSession();
	$inspect(session);
	const user = $derived(session?.claims ?? null);
	const roleLabel = $derived(user?.isAdmin === true ? 'admin' : 'viewer');
	$inspect(user);
	let signInError = $state<string | null>(null);

	async function signInWithGitHub(): Promise<void> {
		signInError = null;

		const result = await authClient.signIn.social({
			provider: 'github',
			callbackURL: '/host'
		});

		if (result.error) {
			signInError = result.error.message ?? 'Sign in failed';
		}
	}
</script>

<section class="surface" data-depth="medium">
	{#if user?.id}
		<h1>Signed in</h1>
		<p>{user?.displayName ?? session?.user_id}</p>
		<p>Role: {roleLabel}</p>
		<p><a href={resolve('/host')}>Continue to host</a></p>
	{:else}
		<h1>Login</h1>
		<button data-variant="primary" onclick={signInWithGitHub}>Sign in with GitHub</button>
	{/if}

	{#if signInError}
		<p>{signInError}</p>
	{/if}
</section>
