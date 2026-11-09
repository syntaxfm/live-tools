<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { fly, scale } from 'svelte/transition';

	import type { OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';

	let { design }: { design: OverlayDesignState } = $props();
</script>

{#if design.meme}
	{#key design.meme.id}
		<figure
			class="meme"
			data-tone={design.meme.tone}
			in:scale|global={{ start: 0.5, duration: 340, easing: backOut }}
			out:fly|global={{ y: -60, duration: 200 }}
		>
			<figcaption class="meme__caption">{design.meme.top}</figcaption>
			<span class="meme__art">{design.meme.emoji}</span>
			<figcaption class="meme__caption">{design.meme.bottom}</figcaption>
		</figure>
	{/key}
{/if}

<style>
	.meme {
		position: absolute;
		top: 200px;
		left: 660px;
		display: flex;
		width: 600px;
		height: 600px;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		margin: 0;
		padding: 24px;
		border: 4px solid var(--color-ink);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised-lg);
		rotate: -3deg;
	}

	.meme[data-tone='coral'] {
		background: var(--color-coral);
	}

	.meme[data-tone='info'] {
		background: var(--color-info);
	}

	.meme[data-tone='purple'] {
		background: var(--color-purple);
	}

	.meme__art {
		font-size: 240px;
		line-height: 1;
	}

	.meme__caption {
		color: #fff;
		font-family: Impact, 'Arial Black', sans-serif;
		font-size: 60px;
		line-height: 1.05;
		text-align: center;
		text-transform: uppercase;
		-webkit-text-stroke: 3px #000;
		paint-order: stroke fill;
	}
</style>
