<script lang="ts">
	let { children } = $props();
</script>

<div>
	{@render children()}
</div>

<style>
	div {
		position: relative;
		width: 1920px;
		height: 1080px;
		overflow: hidden;
		background: transparent;
	}
</style>
