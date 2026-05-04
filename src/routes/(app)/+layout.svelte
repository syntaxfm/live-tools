<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	const pathname = $derived(page.url.pathname);
	const isHostRoute = $derived(pathname === '/host' || pathname.startsWith('/host/'));
	const isAdminRoute = $derived(pathname === '/admin' || pathname.startsWith('/admin/'));
	const isSettingsRoute = $derived(pathname === '/settings' || pathname.startsWith('/settings/'));
</script>

<div class="app-shell">
	<header class="app-header">
		<a class="brand-lockup" href={resolve('/')}>
			<span class="brand-mark"></span>
			<span>Pole</span>
		</a>
		<nav class="tabs" aria-label="Primary">
			<a class:is-active={isHostRoute} class="tab" href={resolve('/host')}>Host</a>
			<a class:is-active={isAdminRoute} class="tab" href={resolve('/admin')}>Admin</a>
			<a class:is-active={isSettingsRoute} class="tab" href={resolve('/settings')}>Settings</a>
		</nav>
	</header>

	<main class="app-main">
		{@render children()}
	</main>
</div>
