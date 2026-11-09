<script lang="ts">
	import {
		OVERLAY_LAYERS,
		OVERLAY_LAYOUT_PRESETS,
		OVERLAY_WIDGETS,
		STUB_HOSTS,
		STUB_MEMES,
		STUB_TOPICS
	} from '$lib/components/shows/overlay-design.svelte';
	import type { OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';
	import { OVERLAY_ANCHORS, OVERLAY_GRID_TRACKS } from '$lib/utils/overlays';

	let { design }: { design: OverlayDesignState } = $props();
</script>

<aside class="dock">
	<section>
		<h2>Scene</h2>
		<div class="row">
			<button type="button" onclick={() => design.showEverything()}>Show all</button>
			<button type="button" onclick={() => design.clearFrame()}>Clear frame</button>
		</div>
	</section>

	<section>
		<h2>Layers</h2>
		<div class="row">
			{#each OVERLAY_LAYERS as { layer, label } (layer)}
				<button
					type="button"
					data-active={design.layers[layer]}
					onclick={() => design.toggleLayer(layer)}>{label}</button
				>
			{/each}
		</div>
	</section>

	<section>
		<h2>Layout</h2>
		<div class="row">
			{#each OVERLAY_LAYOUT_PRESETS as preset (preset.id)}
				<button type="button" onclick={() => design.applyLayoutPreset(preset.id)}
					>{preset.label}</button
				>
			{/each}
		</div>
	</section>

	{#each OVERLAY_WIDGETS as { widget, label } (widget)}
		{@const placement = design.placements[widget]}
		<section>
			<h2>{label}</h2>
			<div class="placement">
				<div class="anchors">
					{#each OVERLAY_ANCHORS as anchorY (anchorY)}
						{#each OVERLAY_ANCHORS as anchorX (anchorX)}
							<button
								type="button"
								aria-label={`Anchor ${label} ${anchorY} ${anchorX}`}
								data-selected={placement.anchorX === anchorX && placement.anchorY === anchorY}
								onclick={() => design.setWidgetAnchor(widget, anchorX, anchorY)}
							></button>
						{/each}
					{/each}
				</div>
				<div class="spans">
					<label>
						<span>W {placement.columns}</span>
						<input
							type="range"
							min="1"
							max={OVERLAY_GRID_TRACKS}
							value={placement.columns}
							oninput={(event) =>
								design.setWidgetSpan(widget, 'columns', event.currentTarget.valueAsNumber)}
						/>
					</label>
					<label>
						<span>H {placement.rows}</span>
						<input
							type="range"
							min="1"
							max={OVERLAY_GRID_TRACKS}
							value={placement.rows}
							oninput={(event) =>
								design.setWidgetSpan(widget, 'rows', event.currentTarget.valueAsNumber)}
						/>
					</label>
				</div>
			</div>
		</section>
	{/each}

	<section>
		<h2>Bottom bar</h2>
		<div class="row">
			<button type="button" onclick={() => design.toggleTopicStyle()}
				>{design.isTopicRailroad ? 'Topics: railroad' : 'Topics: headline'}</button
			>
			<button type="button" onclick={() => design.toggleBottomBarDocked()}
				>{design.isBottomBarDocked ? 'Docked' : 'Overlaid'}</button
			>
			<button
				type="button"
				disabled={!design.isBottomBarDocked}
				onclick={() => design.toggleFootageCropped()}
				>{design.isFootageCropped ? 'Video: crop' : 'Video: fit'}</button
			>
		</div>
	</section>

	<section>
		<h2>Topics</h2>
		<div class="row">
			<button type="button" disabled={design.topicIndex === 0} onclick={() => design.moveTopic(-1)}
				>Previous</button
			>
			<button
				type="button"
				disabled={design.topicIndex === STUB_TOPICS.length - 1}
				onclick={() => design.moveTopic(1)}>Next</button
			>
		</div>
	</section>

	<section>
		<h2>Chat</h2>
		<div class="row">
			<button type="button" onclick={() => design.burstChat()}>Burst</button>
		</div>
	</section>

	<section>
		<h2>Broadcast</h2>
		<div class="row">
			{#each STUB_HOSTS as host (host.showHostId)}
				<button
					type="button"
					data-active={design.lowerThird?.showHostId === host.showHostId}
					onclick={() => design.broadcast(host)}>{host.displayName}</button
				>
			{/each}
			<button type="button" disabled={!design.lowerThird} onclick={() => design.hideLowerThird()}
				>Hide</button
			>
		</div>
	</section>

	<section>
		<h2>Popdowns</h2>
		<div class="row">
			<button type="button" onclick={() => design.showExploitPopdown()}>Days since exploit</button>
			<button type="button" onclick={() => design.showAgenticPopdown()}>Agentic count</button>
			<button type="button" disabled={!design.popdown} onclick={() => design.hidePopdown()}
				>Hide</button
			>
		</div>
	</section>

	<section>
		<h2>Pinned comment</h2>
		<div class="row">
			<button type="button" onclick={() => design.pinNext()}>Pin next</button>
			<button type="button" disabled={!design.pinned} onclick={() => design.unpin()}>Unpin</button>
		</div>
	</section>

	<section>
		<h2>Poll</h2>
		<div class="row">
			<button type="button" data-active={!!design.pollOptions} onclick={() => design.togglePoll()}
				>{design.pollOptions ? 'End poll' : 'Start poll'}</button
			>
		</div>
	</section>

	<section>
		<h2>Meme</h2>
		<div class="row">
			{#each STUB_MEMES as meme, index (meme.top)}
				<button type="button" onclick={() => design.showMeme(index)}>{meme.emoji} {meme.top}</button
				>
			{/each}
			<button type="button" disabled={!design.meme} onclick={() => design.clearMeme()}>Clear</button
			>
		</div>
	</section>
</aside>

<style>
	.dock {
		display: flex;
		width: 300px;
		flex-direction: column;
		gap: 16px;
		overflow-y: auto;
		padding: 16px;
		border-left: var(--border-width) solid var(--color-border);
		background: var(--color-surface);
	}

	h2 {
		margin: 0 0 6px;
		color: var(--color-accent);
		font-family: var(--font-label);
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	button {
		padding: 6px 10px;
		font-size: 14px;
	}

	button[data-active='true'] {
		outline: 1px solid var(--color-accent);
	}

	.placement {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.anchors {
		display: grid;
		flex: none;
		gap: 3px;
		grid-template-columns: repeat(3, 18px);
	}

	.anchors > button {
		width: 18px;
		height: 18px;
		min-height: 0;
		padding: 0;
	}

	.anchors > button[data-selected='true'] {
		background: var(--color-accent);
	}

	.spans {
		display: grid;
		min-width: 0;
		flex: 1;
		gap: 4px;
	}

	.spans > label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-label);
		font-size: 13px;
	}

	.spans span {
		width: 40px;
		flex: none;
	}

	.spans input {
		min-width: 0;
		flex: 1;
		padding: 0;
	}
</style>
