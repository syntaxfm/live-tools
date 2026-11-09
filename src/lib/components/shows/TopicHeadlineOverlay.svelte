<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	import { asset } from '$app/paths';
	import { STUB_TOPICS } from '$lib/components/shows/overlay-design.svelte';
	import type { OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';
	import { formatShowClock } from '$lib/utils/overlays';

	let { design }: { design: OverlayDesignState } = $props();

	const VISIBLE_PAST_TOPICS = 2;

	const currentTopic = $derived(STUB_TOPICS[design.topicIndex]);
	const pastTopics = $derived(
		STUB_TOPICS.slice(Math.max(0, design.topicIndex - VISIBLE_PAST_TOPICS), design.topicIndex)
	);
	const upcomingTopics = $derived(STUB_TOPICS.slice(design.topicIndex + 1));
</script>

<section class="headline-bar">
	<div class="paper">
		<div class="logo">
			<img src={asset('/assets/brand/syntax-wordmark-stacked.svg')} alt="Syntax" />
		</div>

		<div class="rows">
			<div class="current">
				{#key currentTopic.id}
					<h2
						class="current__title"
						in:fly={{ y: 48, duration: 360 }}
						out:fly={{ y: -48, duration: 240 }}
					>
						{currentTopic.title}
					</h2>
				{/key}
			</div>

			{#key currentTopic.id}
				<div class="others" in:fade={{ duration: 320 }}>
					{#each pastTopics as topic (topic.id)}
						<span class="topic" data-role="past">
							{topic.title}
							<time>{formatShowClock(topic.startSeconds)}</time>
						</span>
					{/each}
					<div class="direction-chips">
						{#if pastTopics.length}
							<span class="direction-chip" data-direction="back">Past</span>
						{/if}
						{#if upcomingTopics.length}
							<span class="direction-chip" data-direction="forward">Upcoming</span>
						{/if}
					</div>
					{#each upcomingTopics as topic (topic.id)}
						<span class="topic" data-role="upcoming">{topic.title}</span>
					{/each}
				</div>
			{/key}
		</div>
	</div>
</section>

<style>
	.headline-bar {
		position: relative;
		height: 100%;
	}

	/* A black copy of the rip sits behind the paper to form a ripped border. */
	.headline-bar::before {
		position: absolute;
		background: var(--color-ink);
		content: '';
		inset: 0;
		mask-image: linear-gradient(#000, #000), var(--rip-image);
		mask-repeat: no-repeat, repeat-x;
		mask-size:
			100% 100%,
			var(--rip-width) var(--rip-height);
		mask-position:
			0 0,
			center 0;
		mask-composite: subtract, add;
	}

	/* The same rip, nudged down and across so the black shows unevenly around it. */
	.paper {
		position: relative;
		display: flex;
		height: 100%;
		mask-image: linear-gradient(#000, #000), linear-gradient(#000, #000), var(--rip-image);
		mask-repeat: no-repeat, no-repeat, repeat-x;
		mask-size:
			100% 100%,
			100% var(--rip-rim),
			var(--rip-width) var(--rip-height);
		mask-position:
			0 0,
			0 0,
			calc(50% + var(--rip-offset-x)) var(--rip-rim);
		mask-composite: subtract, add, add;
	}

	.logo {
		display: grid;
		width: 150px;
		flex: none;
		place-items: center;
		padding-top: 18px;
		background: var(--color-ink);
	}

	.logo > img {
		height: 92px;
	}

	.rows {
		display: grid;
		min-width: 0;
		flex: 1;
		grid-template-rows: 1fr 40px;
		background: linear-gradient(var(--color-ink), var(--color-ink)) bottom / 100% 40px no-repeat;
	}

	.current {
		position: relative;
		overflow: hidden;
		background: var(--color-ink);
		color: var(--color-ink);
	}

	/* Grit lives on its own layer so the headline text stays crisp. */
	.current::before {
		position: absolute;
		background: var(--color-syntax-gold);
		content: '';
		inset: 0;
		mask-image: var(--grit-image);
		mask-repeat: repeat;
		mask-size: var(--grit-size);
	}

	.current__title {
		position: absolute;
		inset: 22px 24px 0;
		display: flex;
		align-items: center;
		margin: 0;
		color: var(--color-ink);
		font-size: 48px;
		font-weight: 700;
		letter-spacing: -0.5px;
		line-height: 1;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.others {
		display: flex;
		align-items: stretch;
		gap: 24px;
		overflow: hidden;
		padding: 0 24px;
		white-space: nowrap;
		mask-image: linear-gradient(90deg, #000 calc(100% - 60px), transparent);
	}

	.direction-chips {
		display: flex;
		flex: none;
		align-items: stretch;
	}

	.direction-chip {
		--arrow-depth: 14px;

		display: inline-flex;
		flex: none;
		align-items: center;
		font-family: var(--font-label);
		font-size: 15px;
		font-weight: 700;
		line-height: 1.3;
		text-transform: uppercase;
	}

	.direction-chip[data-direction='back'] {
		padding: 0 14px 0 calc(var(--arrow-depth) + 10px);
		background: var(--color-danger);
		color: #fff;
		clip-path: polygon(var(--arrow-depth) 0, 100% 0, 100% 100%, var(--arrow-depth) 100%, 0 50%);
	}

	.direction-chip[data-direction='forward'] {
		padding: 0 calc(var(--arrow-depth) + 10px) 0 14px;
		background: var(--color-success);
		color: var(--color-ink);
		clip-path: polygon(
			0 0,
			calc(100% - var(--arrow-depth)) 0,
			100% 50%,
			calc(100% - var(--arrow-depth)) 100%,
			0 100%
		);
	}

	.topic {
		display: inline-flex;
		flex: none;
		align-items: baseline;
		align-self: center;
		gap: 8px;
		font-size: 19px;
		font-weight: 500;
	}

	.topic[data-role='past'] {
		color: var(--color-text-subtle);
	}

	.topic[data-role='upcoming'] {
		color: var(--color-text);
	}

	.topic > time {
		font-family: var(--font-label);
		font-size: 15px;
		font-variant-numeric: tabular-nums;
	}
</style>
