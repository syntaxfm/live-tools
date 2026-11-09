<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	import type { OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';

	let { design }: { design: OverlayDesignState } = $props();
</script>

<div class="popdown-slot">
	{#if design.popdown}
		{#key design.popdown.id}
			<section
				class="popdown"
				in:fly|global={{ y: -180, duration: 460, easing: backOut }}
				out:fly|global={{ y: -180, duration: 240 }}
			>
				<h2 class="popdown__label">{design.popdown.label}</h2>
				<p class="popdown__value">{design.popdown.value}</p>
			</section>
		{/key}
	{/if}
</div>

<style>
	.popdown-slot {
		display: grid;
		justify-items: center;
	}

	/* A solid body with a row of downward teeth cut along the bottom. */
	.popdown {
		--tooth-depth: 14px;

		display: flex;
		align-items: center;
		gap: 24px;
		grid-area: 1 / 1;
		padding: 18px 36px calc(var(--tooth-depth) + 16px);
		background: #000;
		pointer-events: auto;
		mask-image:
			linear-gradient(#000, #000), conic-gradient(from -45deg at 50% 100%, #000 90deg, #0000 0);
		mask-repeat: no-repeat, repeat-x;
		mask-size:
			100% calc(100% - var(--tooth-depth)),
			calc(var(--tooth-depth) * 2) var(--tooth-depth);
		mask-position:
			0 0,
			center bottom;
	}

	.popdown__label {
		margin: 0;
		color: #fff;
		font-size: 44px;
		font-weight: 700;
		letter-spacing: -0.5px;
		line-height: 1;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.popdown__value {
		margin: 0;
		color: var(--color-syntax-gold);
		font-size: 60px;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		line-height: 1;
	}
</style>
