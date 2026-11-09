<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import { asset } from '$app/paths';
	import ChatOverlay from '$lib/components/shows/ChatOverlay.svelte';
	import MemeOverlay from '$lib/components/shows/MemeOverlay.svelte';
	import OverlayDesignControls from '$lib/components/shows/OverlayDesignControls.svelte';
	import PinnedCommentOverlay from '$lib/components/shows/PinnedCommentOverlay.svelte';
	import PlugsOverlay from '$lib/components/shows/PlugsOverlay.svelte';
	import PollOverlay from '$lib/components/shows/PollOverlay.svelte';
	import PopdownOverlay from '$lib/components/shows/PopdownOverlay.svelte';
	import TopicHeadlineOverlay from '$lib/components/shows/TopicHeadlineOverlay.svelte';
	import TopicRailroadOverlay from '$lib/components/shows/TopicRailroadOverlay.svelte';
	import LowerThirdOverlay from '$lib/components/shows/LowerThirdOverlay.svelte';
	import { OVERLAY_WIDGETS, OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';
	import type { OverlayWidget } from '$lib/components/shows/overlay-design.svelte';
	import { OVERLAY_GRID_TRACKS, fillVacatedSpace, getGridOffset } from '$lib/utils/overlays';
	import type { GridRect } from '$lib/utils/overlays';
	import type { LowerThirdView } from '$lib/components/shows/room-protocol';

	let { liveLowerThird }: { liveLowerThird: LowerThirdView | null } = $props();

	const CANVAS_WIDTH = 1920;
	const CANVAS_HEIGHT = 1080;
	const DOCK_WIDTH = 300;
	const FRAME_GUTTER = 32;
	const RAILROAD_BAR_HEIGHT = 96;
	const HEADLINE_BAR_HEIGHT = 124;
	const PLUGS_BAR_HEIGHT = 36;

	const design = new OverlayDesignState();

	let windowWidth = $state(CANVAS_WIDTH);
	let windowHeight = $state(CANVAS_HEIGHT);

	const scale = $derived(
		Math.min(
			(windowWidth - DOCK_WIDTH - FRAME_GUTTER) / CANVAS_WIDTH,
			(windowHeight - FRAME_GUTTER) / CANVAS_HEIGHT,
			1
		)
	);

	const timelineBarHeight = $derived(
		design.isTopicRailroad ? RAILROAD_BAR_HEIGHT : HEADLINE_BAR_HEIGHT
	);
	const bottomBarsHeight = $derived(
		(design.layers.timeline ? timelineBarHeight : 0) + (design.layers.plugs ? PLUGS_BAR_HEIGHT : 0)
	);

	// The video runs under the headline bar's rip so the torn edge sits on the picture.
	const footageOverlap = $derived(
		design.layers.timeline && !design.isTopicRailroad ? 'var(--rip-height)' : '0px'
	);

	function getPlacedRect(widget: OverlayWidget): GridRect {
		const { anchorX, anchorY, columns, rows } = design.placements[widget];
		return {
			column: getGridOffset(anchorX, columns),
			row: getGridOffset(anchorY, rows),
			columns,
			rows
		};
	}

	const visibleWidgets = $derived(
		OVERLAY_WIDGETS.map(({ widget }) => widget).filter((widget) => {
			if (widget === 'chat') return design.layers.chat;
			return widget === 'poll' ? design.pollOptions !== null : design.pinned !== null;
		})
	);

	const widgetRects = $derived(
		fillVacatedSpace(
			{
				chat: getPlacedRect('chat'),
				poll: getPlacedRect('poll'),
				pinned: getPlacedRect('pinned')
			},
			visibleWidgets
		)
	);

	function playFootage(video: HTMLVideoElement): void {
		video.muted = true;
		video.play().catch((error: unknown) => {
			console.error('Unable to start preview footage', error);
		});
	}

	onMount(() => design.start());
</script>

<svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight} />

<div class="design-shell">
	<main class="design-area">
		<div
			class="design-frame"
			style:width={`${CANVAS_WIDTH * scale}px`}
			style:height={`${CANVAS_HEIGHT * scale}px`}
		>
			<div
				class="canvas"
				style:transform={`scale(${scale})`}
				style:--bottom-bars-height={`${bottomBarsHeight}px`}
				style:--footage-overlap={footageOverlap}
				data-bottom-bar={design.isBottomBarDocked ? 'docked' : 'overlaid'}
				data-footage-fit={design.isFootageCropped ? 'crop' : 'fit'}
			>
				{#if design.layers.footage}
					<video
						class="footage"
						src={asset('/dev/overlay-preview.mp4')}
						use:playFootage
						autoplay
						muted
						loop
						playsinline
					></video>
				{/if}

				<div class="layer layer--widgets" style:--grid-tracks={OVERLAY_GRID_TRACKS}>
					{#each OVERLAY_WIDGETS as { widget } (widget)}
						{@const rect = widgetRects[widget]}
						<div
							class="widget"
							data-visible={visibleWidgets.includes(widget)}
							style:--column={rect.column}
							style:--row={rect.row}
							style:--columns={rect.columns}
							style:--rows={rect.rows}
						>
							{#if widget === 'chat'}
								<ChatOverlay {design} />
							{:else if widget === 'poll'}
								<PollOverlay {design} />
							{:else}
								<PinnedCommentOverlay {design} />
							{/if}
						</div>
					{/each}
				</div>

				<div class="layer layer--lower-third">
					<LowerThirdOverlay host={design.lowerThird ?? liveLowerThird} />
				</div>

				<div class="layer layer--bottom-bars">
					{#if design.layers.timeline}
						<div
							class="bar bar--timeline"
							style:height={`${timelineBarHeight}px`}
							transition:slide={{ duration: 320 }}
						>
							{#if design.isTopicRailroad}
								<TopicRailroadOverlay {design} />
							{:else}
								<TopicHeadlineOverlay {design} />
							{/if}
						</div>
					{/if}
					{#if design.layers.plugs}
						<div
							class="bar"
							style:height={`${PLUGS_BAR_HEIGHT}px`}
							transition:slide={{ duration: 320 }}
						>
							<PlugsOverlay />
						</div>
					{/if}
				</div>

				<div class="layer layer--popdown">
					<PopdownOverlay {design} />
				</div>

				<MemeOverlay {design} />
			</div>
		</div>
	</main>

	<OverlayDesignControls {design} />
</div>

<style>
	:global(html:has(.design-shell)),
	:global(body:has(.design-shell)),
	:global(.overlay-root:has(.design-shell)) {
		width: 100vw !important;
		height: 100vh !important;
		min-height: 0 !important;
	}

	.design-shell {
		display: flex;
		width: 100vw;
		height: 100vh;
		background: var(--color-ink);
	}

	.design-area {
		display: grid;
		min-width: 0;
		flex: 1;
		place-items: center;
	}

	.design-frame {
		position: relative;
		overflow: hidden;
	}

	.canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 1920px;
		height: 1080px;
		overflow: hidden;
		outline: 1px solid red;
		outline-offset: -1px;
		transform-origin: top left;
	}

	.footage {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: height 320ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	.canvas[data-bottom-bar='docked'] .footage {
		height: calc(100% - var(--bottom-bars-height) + var(--footage-overlap));
	}

	.canvas[data-bottom-bar='docked'][data-footage-fit='fit'] .footage {
		object-fit: contain;
	}

	.layer {
		position: absolute;
	}

	/* The free space above the bottom bars: widgets anchor and span across its tracks. */
	.layer--widgets {
		--grid-gap: 10px;

		top: 24px;
		right: 24px;
		bottom: calc(var(--bottom-bars-height) + 48px);
		left: 24px;
		pointer-events: none;
	}

	.canvas[data-bottom-bar='docked'] .layer--widgets {
		bottom: calc(var(--bottom-bars-height) + 24px);
	}

	/* Each widget's content restyles itself from this container's size. */
	.widget {
		--track-x: calc((100% + var(--grid-gap)) / var(--grid-tracks));
		--track-y: calc((100% + var(--grid-gap)) / var(--grid-tracks));

		position: absolute;
		top: calc(var(--track-y) * var(--row));
		left: calc(var(--track-x) * var(--column));
		width: calc(var(--track-x) * var(--columns) - var(--grid-gap));
		height: calc(var(--track-y) * var(--rows) - var(--grid-gap));
		container: widget / size;
		pointer-events: auto;
		transition:
			top 320ms cubic-bezier(0.33, 1, 0.68, 1),
			left 320ms cubic-bezier(0.33, 1, 0.68, 1),
			width 320ms cubic-bezier(0.33, 1, 0.68, 1),
			height 320ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	.widget[data-visible='false'] {
		pointer-events: none;
	}

	/* This layer spans the frame, so only the card itself should catch the inspector. */
	.layer--lower-third :global(.lt-root) {
		pointer-events: auto;
	}

	.layer--lower-third {
		pointer-events: none;
		top: 0;
		right: 0;
		bottom: calc(var(--bottom-bars-height) + 24px);
		left: 470px;
	}

	.canvas[data-bottom-bar='docked'] .layer--lower-third {
		bottom: var(--bottom-bars-height);
	}

	.layer--popdown {
		top: 0;
		right: 0;
		left: 0;
		pointer-events: none;
	}

	.layer--bottom-bars {
		right: 24px;
		bottom: 24px;
		left: 24px;
		overflow: hidden;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised-lg);
		transition:
			left 320ms ease,
			right 320ms ease,
			bottom 320ms ease,
			border-radius 320ms ease;
	}

	.canvas[data-bottom-bar='docked'] .layer--bottom-bars {
		right: 0;
		bottom: 0;
		left: 0;
		border-radius: 0;
		box-shadow: none;
	}

	.bar--timeline {
		overflow: hidden;
	}
</style>
