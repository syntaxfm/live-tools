<script lang="ts">
	let { children } = $props();
</script>

<div class="overlay-root">
	{@render children()}
</div>
