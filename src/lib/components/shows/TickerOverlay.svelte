<script lang="ts">
	import { flip } from 'svelte/animate';

	import { asset } from '$app/paths';
	import type { TickerMessageView } from '$lib/components/shows/room-protocol';
	import { getTickerLoopMessages } from '$lib/utils/ticker-messages';
	import { tickerScrollDuration } from './ticker-scroll';

	let { messages }: { messages: TickerMessageView[] } = $props();
	const loopMessages = $derived(getTickerLoopMessages(messages));
</script>

<div class="ticker-stage">
	<section class="ticker" aria-live="polite">
		<div class="ticker__label">
			<span class="ticker__pulse"></span>
			<img
				class="ticker__logo"
				src={asset('/assets/brand/syntax-wordmark-wide.svg')}
				alt="Syntax"
			/>
		</div>

		<div class="ticker__track">
			<div class="ticker__content">
				<span class="ticker__block" use:tickerScrollDuration>
					{#each loopMessages as message, index (`primary-${message.id}-${index}`)}
						<div animate:flip={{ duration: 200 }}>
							<span class="ticker__item">{message.text}</span>
							<span class="ticker__separator">◆</span>
						</div>
					{/each}
				</span>

				<span class="ticker__block" aria-hidden="true">
					{#each loopMessages as message, index (`secondary-${message.id}-${index}`)}
						<span class="ticker__item">{message.text}</span>
						<span class="ticker__separator">◆</span>
					{/each}
				</span>
			</div>
		</div>
	</section>
</div>

<style>
	/* The wordmark ships in brand gold, which disappears on the yellow label. */
	.ticker__logo {
		height: 36px;
		filter: brightness(0);
	}
</style>
