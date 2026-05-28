<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';
	import { clearSession, getClientSession } from '$lib/session.svelte';

	const session = getClientSession();
	const roleLabel = $derived(session.isAdmin ? 'admin' : 'viewer');

	let signOutError = $state<string | null>(null);
	let isSigningOut = $state(false);

	async function handleSignOut(): Promise<void> {
		signOutError = null;
		isSigningOut = true;

		try {
			const result = await authClient.signOut();
			if (result.error) {
				signOutError = result.error.message ?? 'Sign out failed';
				return;
			}
			clearSession();
			await goto(resolve('/login'));
		} catch (error) {
			console.error('Unable to sign out', error);
			signOutError = 'Sign out failed';
		} finally {
			isSigningOut = false;
		}
	}
</script>

<section class="surface" data-depth="medium">
	<p class="section-label">Settings</p>
	<h1>Account</h1>

	{#if session.claims}
		<p>{session.claims.name}</p>
		<p>{session.claims.githubUsername}</p>
		<p><span class="badge">{roleLabel}</span></p>
	{/if}

	<button disabled={isSigningOut} data-variant="danger" onclick={handleSignOut}>Sign out</button>

	{#if signOutError}
		<p class="status" data-state="warning">{signOutError}</p>
	{/if}
</section>
