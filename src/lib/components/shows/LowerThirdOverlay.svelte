<script lang="ts">
	import { type Show, type ShowHost } from '$lib/schema';
	import { getLowerThirdAsset, getLowerThirdTitle } from '$lib/utils/lower-thirds';
	import { fly } from 'svelte/transition';

	interface Props {
		show: Show & {
			activeLowerThirdShowHost: ShowHost | null;
		};
	}

	let { show }: Props = $props();
	const host = $derived(show.activeLowerThirdShowHost);
	const asset = $derived(getLowerThirdAsset(host));
	const title = $derived(getLowerThirdTitle(host));
</script>

<div class="lower-third-stage">
	{#if host?.id}
		<section
			transition:fly={{ y: 40, opacity: 0 }}
			class="lt-root"
			data-tone={asset.tone}
			aria-live="polite"
		>
			<div class="lt-avatar">
				<img src={asset.src} alt="" />
			</div>

			<div class="lt-card">
				<h1 class="lt-display-name">{host.displayName}</h1>
				<p class="lt-byline">{title}</p>
			</div>
		</section>
	{/if}
</div>

<style>
	.lower-third-stage {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-end;
		justify-content: flex-start;
		padding: 24px 24px 36px;
		pointer-events: none;
	}

	.lt-root {
		position: relative;
		display: inline-block;
		max-width: min(92vw, 560px);
		padding: 64px 0 6px 8px;
	}

	.lt-avatar {
		position: absolute;
		z-index: 2;
		top: -30px;
		left: -30px;
		width: clamp(180px, 26vw, 230px);
		pointer-events: none;
		filter: drop-shadow(3px 4px 0 rgb(5 5 4 / 65%)) drop-shadow(0 1px 0 rgb(247 246 242 / 6%));
	}

	.lt-avatar > img {
		width: 100%;
		height: auto;
	}

	.lt-card {
		position: relative;
		z-index: 1;
		min-width: 360px;
		padding: 14px 20px 14px clamp(128px, 19vw, 160px);
		border: var(--border-width) solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		box-shadow: var(--shadow-raised-lg);
	}

	.lt-root[data-tone='accent'] .lt-card {
		--shadow-color: #6b4f32;
		border-color: #d4a574;
	}

	.lt-root[data-tone='info'] .lt-card {
		--shadow-color: #25574d;
		border-color: var(--color-info);
	}

	.lt-root[data-tone='purple'] .lt-card {
		--shadow-color: #4a3d7a;
		border-color: var(--color-purple);
	}

	.lt-root[data-tone='coral'] .lt-card {
		--shadow-color: #7a2f1a;
		border-color: var(--color-coral);
	}

	.lt-display-name {
		margin-bottom: 4px;
		color: var(--color-text);
		font-size: clamp(22px, 4.2vw, 32px);
		font-weight: 700;
		line-height: 1.1;
	}

	.lt-byline {
		color: var(--color-text-muted);
		font-size: clamp(15px, 2.6vw, 20px);
		font-weight: 500;
		line-height: 1.4;
	}

	.lt-byline:empty::before {
		content: '-';
		opacity: 0.35;
	}
</style>
