<script lang="ts">
	import { authClient } from '$lib/auth-client';
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

<button data-variant="primary" onclick={signInWithGitHub}>Sign in with GitHub</button>

{#if signInError}
	<p>{signInError}</p>
{/if}
