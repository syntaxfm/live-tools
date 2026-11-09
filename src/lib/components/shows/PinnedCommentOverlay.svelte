<script lang="ts">
	import { fade } from 'svelte/transition';

	import { asset } from '$app/paths';
	import type { OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';

	let { design }: { design: OverlayDesignState } = $props();
</script>

{#if design.pinned}
	<section class="pinned" transition:fade={{ duration: 200 }}>
		<img class="pinned__avatar" src={design.pinned.avatarSrc} alt="" />
		<div class="pinned__body">
			<p class="pinned__author">
				<img
					class="pinned__platform"
					src={asset(`/assets/platforms/${design.pinned.platform}.svg`)}
					alt={design.pinned.platform}
				/>
				{design.pinned.author}
			</p>
			<p class="pinned__text">{design.pinned.text}</p>
		</div>
	</section>
{/if}

<style>
	.pinned {
		position: relative;
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;
		padding: 12px 14px 12px 72px;
		background: #fff;
	}

	/* Straddles the card's left edge. */
	.pinned__avatar {
		position: absolute;
		top: 50%;
		left: -16px;
		width: 76px;
		height: 76px;
		border-radius: 50%;
		transform: translateY(-50%);
	}

	.pinned__body {
		min-width: 0;
		overflow: hidden;
	}

	.pinned__author {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0 0 2px;
		color: #000;
		font-size: 20px;
		font-weight: 700;
		line-height: 1.3;
	}

	.pinned__platform {
		width: 22px;
		height: 22px;
		flex: none;
	}

	.pinned__text {
		margin: 0;
		color: #000;
		font-size: 27px;
		font-weight: 600;
		line-height: 1.2;
	}

	/* Narrow card: smaller avatar and type. */
	@container widget (max-width: 320px) {
		.pinned {
			padding-left: 56px;
		}

		.pinned__avatar {
			left: -12px;
			width: 58px;
			height: 58px;
		}

		.pinned__author {
			font-size: 16px;
		}

		.pinned__text {
			font-size: 20px;
		}
	}

	/* Wide and tall enough: scale everything up. */
	@container widget (min-width: 800px) and (min-height: 180px) {
		.pinned {
			padding-left: 108px;
		}

		.pinned__avatar {
			width: 110px;
			height: 110px;
		}

		.pinned__author {
			font-size: 24px;
		}

		.pinned__text {
			font-size: 40px;
		}
	}

	/* Tall column: let the comment take up the room. */
	@container widget (min-height: 400px) and (max-width: 799.98px) {
		.pinned__author {
			font-size: 24px;
		}

		.pinned__text {
			font-size: 40px;
		}
	}

	/* Short strip: one line of comment. */
	@container widget (max-height: 110px) {
		.pinned {
			padding-top: 4px;
			padding-bottom: 4px;
			padding-left: 56px;
		}

		.pinned__avatar {
			width: 58px;
			height: 58px;
		}

		.pinned__author {
			font-size: 15px;
		}

		.pinned__platform {
			width: 16px;
			height: 16px;
		}

		.pinned__text {
			overflow: hidden;
			font-size: 20px;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
</style>
