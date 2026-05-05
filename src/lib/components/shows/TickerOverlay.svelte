<script lang="ts">
	import { createTickerMessagesSubscription } from '$lib/components/shows/show-queries.svelte';
	import {
		compareTickerMessagesByPosition,
		getTickerLoopMessages
	} from '$lib/utils/ticker-messages';

	interface Props {
		showId: string | undefined;
	}

	let { showId }: Props = $props();

	const messages = createTickerMessagesSubscription(() => showId);
	const sortedMessages = $derived(
		[...(messages.current ?? [])].sort(compareTickerMessagesByPosition)
	);
	const loopMessages = $derived(getTickerLoopMessages(sortedMessages));
</script>

{#if loopMessages.length}
	<div class="ticker-stage">
		<section class="ticker" aria-live="polite">
			<div class="ticker__label">
				<span class="ticker__pulse"></span>
				<span>Updates</span>
			</div>

			<div class="ticker__track">
				<div class="ticker__content">
					<span class="ticker__block">
						{#each loopMessages as message, index (`primary-${message.id}-${index}`)}
							<span class="ticker__item">{message.text}</span>
							<span class="ticker__separator">◆</span>
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
{/if}
