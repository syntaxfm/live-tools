<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getDb, getSession } from 'jazz-tools/svelte';

	import { authClient } from '$lib/auth-client';

	const db = getDb();
	const session = getSession();
	const user = $derived(session?.claims ?? null);
	const roleLabel = $derived(user?.isAdmin === true ? 'admin' : 'viewer');

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

			await db.logout().catch((error: unknown) => {
				console.error('Unable to clear Jazz session after sign out', error);
			});

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

	{#if user}
		<p>{user.displayName}</p>
		<p>{session?.claims.githubUsername ?? user.githubUsername}</p>
		<p><span class="badge">{roleLabel}</span></p>
	{/if}

	<button disabled={isSigningOut} data-variant="danger" onclick={handleSignOut}>Sign out</button>

	{#if signOutError}
		<p class="status" data-state="warning">{signOutError}</p>
	{/if}
</section>
