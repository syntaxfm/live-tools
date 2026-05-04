<script lang="ts">
	import { resolve } from '$app/paths';
	import { getJazzContext } from 'jazz-tools/svelte';

	import { authClient } from '$lib/auth-client';
	import { createCurrentAppUserSubscription } from '$lib/components/auth/current-app-user.svelte';

	const jazzContext = getJazzContext();
	const appUsers = createCurrentAppUserSubscription();
	const appUser = $derived(appUsers.current?.[0] ?? null);
	const isExternalSession = $derived(jazzContext.session?.authMode === 'external');
	const roleLabel = $derived(jazzContext.session?.claims.isAdmin === true ? 'admin' : 'viewer');

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
	{#if isExternalSession}
		<h1>Signed in</h1>
		<p>{appUser?.displayName ?? jazzContext.session?.user_id}</p>
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
