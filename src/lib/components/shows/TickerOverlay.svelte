<script lang="ts">
	import { flip } from 'svelte/animate';

	import type { Show, TickerMessage } from '$lib/schema';
	import { getTickerLoopMessages } from '$lib/utils/ticker-messages';
	import { tickerScrollDuration } from './ticker-scroll';

	interface Props {
		show: Show & {
			tickerMessagesViaShow: TickerMessage[];
		};
	}

	let { show }: Props = $props();
	const loopMessages = $derived(getTickerLoopMessages(show.tickerMessagesViaShow));
</script>

<div class="ticker-stage">
	<section class="ticker" aria-live="polite">
		<div class="ticker__label">
			<span class="ticker__pulse"></span>
			<span>Updates</span>
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
