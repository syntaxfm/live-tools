<script lang="ts">
	import { asset } from '$app/paths';
	import { STUB_TOPICS } from '$lib/components/shows/overlay-design.svelte';
	import type { OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';
	import { formatShowClock } from '$lib/utils/overlays';

	let { design }: { design: OverlayDesignState } = $props();

	type StationRole = 'past' | 'current' | 'future';

	const LABEL_GAP = 28;
	const LABEL_INSET = 10;
	const FIRST_STATION_X = 34;
	const ANCHOR_X = 640;
	const VIEWPORT_WIDTH = 1790;
	const TRACK_TRAILING_WIDTH = 80;
	const TRACK_HEIGHT = 46;
	const LANE_Y = [14, 32];
	const CURVE_HALF_WIDTH = 30;

	// Each station takes only the width its rendered label needs.
	let labelWidths = $state<number[]>(STUB_TOPICS.map(() => 0));

	const stationXs = $derived.by(() => {
		let nextX = FIRST_STATION_X;
		return STUB_TOPICS.map((_, index) => {
			const stationX = nextX;
			nextX += labelWidths[index] + LABEL_GAP;
			return stationX;
		});
	});

	function buildTrackPath(width: number): string {
		let path = `M 0 ${LANE_Y[STUB_TOPICS[0].lane]}`;
		for (let index = 0; index < STUB_TOPICS.length - 1; index += 1) {
			const fromY = LANE_Y[STUB_TOPICS[index].lane];
			const toY = LANE_Y[STUB_TOPICS[index + 1].lane];
			if (fromY === toY) {
				continue;
			}
			const middleX = (stationXs[index] + stationXs[index + 1]) / 2;
			const curveStart = middleX - CURVE_HALF_WIDTH;
			const curveEnd = middleX + CURVE_HALF_WIDTH;
			path += ` H ${curveStart} C ${middleX} ${fromY}, ${middleX} ${toY}, ${curveEnd} ${toY}`;
		}
		return `${path} H ${width}`;
	}

	const trackWidth = $derived(
		Math.max(
			stationXs[STUB_TOPICS.length - 1] +
				labelWidths[STUB_TOPICS.length - 1] +
				TRACK_TRAILING_WIDTH,
			VIEWPORT_WIDTH
		)
	);
	const trackPath = $derived(buildTrackPath(trackWidth));

	const scrollX = $derived(
		Math.min(
			Math.max(stationXs[design.topicIndex] - ANCHOR_X, 0),
			Math.max(trackWidth - VIEWPORT_WIDTH, 0)
		)
	);

	const progressX = $derived.by(() => {
		const topic = STUB_TOPICS[design.topicIndex];
		const fraction = (design.elapsedSeconds - topic.startSeconds) / topic.durationSeconds;
		const stationX = stationXs[design.topicIndex];
		const nextStationX = stationXs[design.topicIndex + 1] ?? trackWidth;
		return stationX + Math.min(1, Math.max(0, fraction)) * (nextStationX - stationX);
	});

	function getRole(index: number): StationRole {
		if (index === design.topicIndex) return 'current';
		return index < design.topicIndex ? 'past' : 'future';
	}
</script>

<section class="railroad">
	<div class="railroad__logo">
		<img src={asset('/assets/brand/syntax-wordmark-stacked.svg')} alt="Syntax" />
	</div>

	<div class="railroad__viewport">
		<div
			class="railroad__scroller"
			style:width={`${trackWidth}px`}
			style:transform={`translateX(${-scrollX}px)`}
		>
			<ol class="railroad__labels">
				{#each STUB_TOPICS as topic, index (topic.id)}
					{@const role = getRole(index)}
					<li
						class="label"
						data-role={role}
						style:left={`${stationXs[index] - LABEL_INSET}px`}
						bind:offsetWidth={labelWidths[index]}
					>
						{#if role === 'current'}<span class="label__pulse"></span>{/if}
						<p class="label__title">{topic.title}</p>
						{#if role === 'past'}
							<time class="label__time">{formatShowClock(topic.startSeconds)}</time>
						{:else if role === 'current'}
							<time class="label__time">{formatShowClock(design.elapsedSeconds)}</time>
						{/if}
					</li>
				{/each}
			</ol>

			<div class="railroad__track" style:height={`${TRACK_HEIGHT}px`}>
				<svg width={trackWidth} height={TRACK_HEIGHT} aria-hidden="true">
					<path class="rail rail--ahead" style:d={`path('${trackPath}')`} />
				</svg>
				<div class="railroad__progress" style:width={`${progressX}px`}>
					<svg width={trackWidth} height={TRACK_HEIGHT} aria-hidden="true">
						<path class="rail rail--travelled" style:d={`path('${trackPath}')`} />
					</svg>
				</div>
				<svg width={trackWidth} height={TRACK_HEIGHT} aria-hidden="true">
					{#each STUB_TOPICS as topic, index (topic.id)}
						{@const role = getRole(index)}
						{#if role === 'current'}
							<circle
								class="station-pulse"
								style:cx={`${stationXs[index]}px`}
								cy={LANE_Y[topic.lane]}
							/>
						{/if}
						<circle
							class="station"
							data-role={role}
							style:cx={`${stationXs[index]}px`}
							cy={LANE_Y[topic.lane]}
						/>
					{/each}
				</svg>
			</div>
		</div>
	</div>
</section>

<style>
	.railroad {
		--rail-gold: var(--color-syntax-gold);

		display: flex;
		height: 100%;
		background: var(--color-ink);
	}

	.railroad__logo {
		display: grid;
		width: 130px;
		flex: none;
		place-items: center;
		border-right: var(--border-width) solid var(--color-border-subtle);
	}

	.railroad__logo > img {
		height: 78px;
	}

	.railroad__viewport {
		position: relative;
		min-width: 0;
		flex: 1;
		overflow: hidden;
		mask-image: linear-gradient(
			90deg,
			transparent 0,
			#000 24px,
			#000 calc(100% - 72px),
			transparent
		);
	}

	.railroad__scroller {
		position: relative;
		height: 100%;
		transition: transform 640ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	.railroad__labels {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.label {
		position: absolute;
		top: 8px;
		display: flex;
		width: max-content;
		align-items: center;
		gap: 8px;
		transition: left 640ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	.label__time {
		flex: none;
		color: var(--color-text-muted);
		font-family: var(--font-label);
		font-size: 16px;
		font-variant-numeric: tabular-nums;
	}

	.label__pulse {
		width: 10px;
		height: 10px;
		flex: none;
		border-radius: 50%;
		background: var(--color-danger);
		animation: ticker-pulse 1.4s ease-in-out infinite;
	}

	.label__title {
		margin: 0;
		color: var(--color-text);
		font-family: var(--font-label);
		font-size: 20px;
		font-weight: 700;
		line-height: 1.4;
		white-space: nowrap;
		transition: color 320ms ease;
	}

	.label[data-role='current'] .label__title,
	.label[data-role='current'] .label__time {
		color: var(--rail-gold);
	}

	.label[data-role='future'] .label__title {
		color: var(--color-text-subtle);
	}

	.railroad__track {
		position: absolute;
		right: 0;
		bottom: 6px;
		left: 0;
	}

	.railroad__track svg {
		position: absolute;
		top: 0;
		left: 0;
		overflow: visible;
	}

	.railroad__progress {
		position: absolute;
		top: -6px;
		bottom: -6px;
		left: 0;
		overflow: hidden;
		transition: width 640ms ease;
	}

	.railroad__progress > svg {
		top: 6px;
	}

	.rail {
		fill: none;
		stroke-linecap: round;
		stroke-width: 6;
		transition: d 640ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	.rail--ahead {
		stroke: var(--color-border);
	}

	.rail--travelled {
		stroke: var(--rail-gold);
	}

	.station {
		stroke-width: 3;
		transition:
			cx 640ms cubic-bezier(0.33, 1, 0.68, 1),
			r 320ms ease,
			fill 320ms ease,
			stroke 320ms ease;
	}

	.station[data-role='past'] {
		r: 9px;
		fill: var(--rail-gold);
		stroke: var(--rail-gold);
	}

	.station[data-role='current'] {
		r: 11px;
		fill: var(--rail-gold);
		stroke: var(--color-ink);
	}

	.station[data-role='future'] {
		r: 7px;
		fill: var(--color-ink);
		stroke: var(--color-border-strong);
	}

	.station-pulse {
		fill: none;
		stroke: var(--rail-gold);
		stroke-width: 2;
		animation: station-pulse 1.6s ease-out infinite;
	}

	@keyframes station-pulse {
		from {
			r: 11px;
			opacity: 0.8;
		}

		to {
			r: 26px;
			opacity: 0;
		}
	}
</style>
