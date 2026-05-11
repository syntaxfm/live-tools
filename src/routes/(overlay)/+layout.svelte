<script lang="ts">
	let { children } = $props();
</script>

<div class="overlay-root">
	{@render children()}
</div>

<style>
	.overlay-root {
		position: relative;
		width: 1920px;
		height: 1080px;
		overflow: hidden;
		background: transparent;
	}
</style>
