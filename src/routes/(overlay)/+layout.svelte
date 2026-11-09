<script lang="ts">
	let { children } = $props();
</script>

<div class="overlay-root">
	{@render children()}
</div>

<style>
	.overlay-root {
		/* On-air graphics are flat and square: no rounded corners or raised shadows. */
		--radius-sm: 0;
		--radius-md: 0;
		--radius-lg: 0;
		--shadow-raised-sm: none;
		--shadow-raised-md: none;
		--shadow-raised-lg: none;

		position: relative;
		width: 1920px;
		height: 1080px;
		overflow: hidden;
		background: transparent;
	}
</style>
