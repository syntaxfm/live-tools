<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';

	import type { OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';

	let { design }: { design: OverlayDesignState } = $props();
</script>

{#if design.layers.chat}
	<section class="chat" transition:fly={{ x: -60, duration: 320 }}>
		<ul class="chat__list">
			{#each design.chat as message (message.id)}
				<li
					class="chat__message"
					data-tone={message.tone}
					in:fly={{ y: 24, duration: 220 }}
					animate:flip={{ duration: 180 }}
				>
					<span class="chat__author">{message.author}</span>
					<span class="chat__text">{message.text}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.chat {
		display: flex;
		height: 100%;
		flex-direction: column;
		overflow: hidden;
		background: rgb(20 20 19 / 88%);
	}

	.chat__list {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		justify-content: flex-end;
		gap: 10px;
		overflow: hidden;
		margin: 0;
		padding: 12px 16px;
		list-style: none;
		mask-image: linear-gradient(180deg, transparent 0, #000 56px);
	}

	.chat__message {
		flex-shrink: 0;
		font-size: 20px;
		line-height: 1.3;
	}

	.chat__author {
		margin-right: 8px;
		font-weight: 700;
	}

	.chat__message[data-tone='accent'] .chat__author {
		color: var(--color-accent);
	}

	.chat__message[data-tone='info'] .chat__author {
		color: var(--color-info);
	}

	.chat__message[data-tone='purple'] .chat__author {
		color: var(--color-purple);
	}

	.chat__message[data-tone='coral'] .chat__author {
		color: var(--color-coral);
	}

	.chat__message[data-tone='success'] .chat__author {
		color: var(--color-success);
	}

	.chat__text {
		color: var(--color-text);
	}

	/* Narrow column: stack the name over the message. */
	@container widget (max-width: 320px) {
		.chat__list {
			gap: 8px;
			padding: 8px 12px;
		}

		.chat__message {
			font-size: 17px;
		}

		.chat__author {
			display: block;
			margin-right: 0;
			font-size: 15px;
		}
	}

	/* Plenty of width: bigger type for the room. */
	@container widget (min-width: 760px) {
		.chat__message {
			font-size: 26px;
		}
	}

	/* Short strip: run the messages sideways, newest on the right. */
	@container widget (max-height: 130px) {
		.chat__list {
			flex-direction: row;
			align-items: center;
			gap: 32px;
			padding: 0 16px;
			mask-image: linear-gradient(90deg, transparent 0, #000 56px);
		}

		.chat__message {
			white-space: nowrap;
		}

		.chat__author {
			display: inline;
			margin-right: 8px;
		}
	}
</style>
