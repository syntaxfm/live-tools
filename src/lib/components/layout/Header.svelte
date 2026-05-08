<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getSession } from 'jazz-tools/svelte';

	const session = getSession();
	const is_admin = $derived(session?.claims.is_admin);
	const pathname = $derived(page.url.pathname);	
</script>

{#if is_admin}
		<header class="app-header">
			<nav class="tabs" aria-label="Primary">
				<a class:active={pathname === '/admin'} class="tab" href={resolve('/admin')}>Live Show</a>
				<a class:active={pathname === '/host'} class="tab" href={resolve('/host')}>Host View</a>
				<a class:active={pathname === '/'} class="tab" href={resolve('/')}>Viewer View</a>
				<a class:active={pathname === '/admin/shows'} class="tab" href={resolve('/admin/shows')}
					>All Shows</a
				>
				<a class:active={pathname === '/admin/users'} class="tab" href={resolve('/admin/users')}
					>Users</a
				>
				<a class:active={pathname === '/settings'} class="tab" href={resolve('/settings')}
					>Settings</a
				>
			</nav>
		</header>
	{/if}