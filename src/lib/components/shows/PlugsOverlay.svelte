<script lang="ts">
	import { asset } from '$app/paths';
	import { STUB_PLUGS } from '$lib/components/shows/overlay-design.svelte';

	// Two identical halves scroll by exactly -50% for a seamless loop. Each half repeats the
	// plugs so it is always wider than the 1920px canvas.
	const HALVES = [0, 1];
	const REPEATS_PER_HALF = [0, 1];
</script>

<section class="plugs">
	<div class="plugs__track">
		{#each HALVES as half (half)}
			<div class="plugs__half" aria-hidden={half === 1}>
				{#each REPEATS_PER_HALF as repeat (repeat)}
					{#each STUB_PLUGS as plug (plug.text)}
						<span class="plug" data-kind={plug.kind}>
							{#if plug.kind === 'x'}
								<svg class="plug__icon" viewBox="0 0 24 24" aria-label="X" role="img">
									<path
										d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
									/>
								</svg>
							{/if}
							{plug.text}
							{#if plug.kind === 'sponsor'}
								<img
									class="plug__sponsor"
									src={asset('/assets/brand/sentry-logo.svg')}
									alt="Sentry"
								/>
							{/if}
						</span>
						<span class="plugs__separator">◆</span>
					{/each}
				{/each}
			</div>
		{/each}
	</div>
</section>

<style>
	.plugs {
		display: flex;
		height: 100%;
		align-items: center;
		overflow: hidden;
		background: #fff;
		color: #000;
	}

	.plugs__track {
		display: flex;
		width: max-content;
		flex: none;
		animation: plugs-scroll 50s linear infinite;
	}

	.plugs__half {
		display: flex;
		flex: none;
		align-items: center;
	}

	.plug {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 8px;
		font-family: var(--font-body);
		font-size: 20px;
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
	}

	.plug__sponsor {
		width: 91px;
		height: 20px;
		flex: none;
	}

	.plug__icon {
		width: 16px;
		height: 16px;
		flex: none;
		fill: currentcolor;
	}

	.plugs__separator {
		flex: none;
		margin: 0 20px;
		font-size: 12px;
	}

	@keyframes plugs-scroll {
		to {
			transform: translateX(-50%);
		}
	}
</style>
