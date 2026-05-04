<script lang="ts">
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<div class="app-shell">
	<header class="app-header">
		<a class="brand-lockup" href={resolve('/')}>
			<span class="brand-mark"></span>
			<span>Pole</span>
		</a>
	</header>

	<main class="app-main">
		{@render children()}
	</main>
</div>
