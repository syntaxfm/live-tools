<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	const pathname = $derived(page.url.pathname);
	const isHostRoute = $derived(pathname === '/host' || pathname.startsWith('/host/'));
	const isAdminRoute = $derived(pathname === '/admin');
	const isViewerRoute = $derived(pathname === '/');
	const isAdminShowsRoute = $derived(
		pathname === '/admin/shows' || pathname.startsWith('/admin/shows/')
	);
	const isSettingsRoute = $derived(pathname === '/settings' || pathname.startsWith('/settings/'));
</script>

<div class="app-shell">
	<header class="app-header">
		<nav class="tabs" aria-label="Primary">
			<a class:is-active={isAdminRoute} class="tab" href={resolve('/admin')}>Admin Show</a>
			<a class:is-active={isHostRoute} class="tab" href={resolve('/host')}>Host View</a>
			<a class:is-active={isViewerRoute} class="tab" href={resolve('/')}>Viewer View</a>
			<a class:is-active={isAdminShowsRoute} class="tab" href={resolve('/admin/shows')}>All Shows</a
			>
			<a class:is-active={isSettingsRoute} class="tab" href={resolve('/settings')}>Settings</a>
		</nav>
	</header>

	<main class="app-main">
		{@render children()}
	</main>
</div>
