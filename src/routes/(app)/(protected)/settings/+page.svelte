<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getDb, getJazzContext } from 'jazz-tools/svelte';

	import { authClient } from '$lib/auth-client';
	import { createCurrentAppUserSubscription } from '$lib/components/auth/current-app-user.svelte';

	const db = getDb();
	const jazzContext = getJazzContext();
	const appUsers = createCurrentAppUserSubscription();
	const appUser = $derived(appUsers.current?.[0] ?? null);
	const roleLabel = $derived(jazzContext.session?.claims.isAdmin === true ? 'admin' : 'viewer');

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

	{#if appUser}
		<p>{appUser.displayName}</p>
		<p>{jazzContext.session?.claims.githubUsername ?? appUser.githubUsername}</p>
		<p><span class="badge">{roleLabel}</span></p>
	{:else if appUsers.loading}
		<p class="status" data-state="connecting">Loading account</p>
	{/if}

	<button disabled={isSigningOut} data-variant="danger" onclick={handleSignOut}>Sign out</button>

	{#if signOutError}
		<p class="status" data-state="warning">{signOutError}</p>
	{/if}
</section>
