<script lang="ts">
	import { fade } from 'svelte/transition';

	import { STUB_POLL_QUESTION } from '$lib/components/shows/overlay-design.svelte';
	import type { OverlayDesignState } from '$lib/components/shows/overlay-design.svelte';

	let { design }: { design: OverlayDesignState } = $props();

	const totalVotes = $derived(
		design.pollOptions?.reduce((total, option) => total + option.votes, 0) ?? 0
	);
	const leadingVotes = $derived(
		Math.max(0, ...(design.pollOptions?.map((option) => option.votes) ?? []))
	);

	function getPercent(votes: number): number {
		return totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
	}
</script>

{#if design.pollOptions}
	<section class="poll" transition:fade={{ duration: 200 }}>
		<p class="poll__label">{totalVotes.toLocaleString()} votes</p>
		<h2 class="poll__question">{STUB_POLL_QUESTION}</h2>
		<ul class="poll__options">
			{#each design.pollOptions as option (option.id)}
				<li class="poll__option" data-leading={option.votes === leadingVotes}>
					<span class="poll__bar" style:width={`${getPercent(option.votes)}%`}></span>
					<span class="poll__name">{option.label}</span>
					<span class="poll__percent">{getPercent(option.votes)}%</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.poll {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		padding: 12px 16px 14px;
		background: #fff;
		color: #000;
	}

	.poll__label {
		margin: 0 0 4px;
		color: #000;
		font-family: var(--font-label);
		font-size: 15px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.poll__question {
		margin: 0 0 10px;
		color: #000;
		font-size: 22px;
		font-weight: 700;
		line-height: 1.2;
	}

	.poll__options {
		display: grid;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.poll__option {
		position: relative;
		display: flex;
		justify-content: space-between;
		gap: 12px;
		overflow: hidden;
		padding: 5px 10px;
		background: #ebebeb;
		color: #000;
		font-size: 18px;
		font-weight: 600;
		white-space: nowrap;
	}

	.poll__bar {
		position: absolute;
		inset: 0 auto 0 0;
		background: #cfcfcf;
		transition: width 400ms ease;
	}

	.poll__option[data-leading='true'] .poll__bar {
		background: var(--color-info);
	}

	.poll__name,
	.poll__percent {
		position: relative;
	}

	.poll__percent {
		font-family: var(--font-label);
		font-variant-numeric: tabular-nums;
	}

	/* Narrow card: tighten the type. */
	@container widget (max-width: 300px) {
		.poll {
			padding: 8px 10px;
		}

		.poll__question {
			font-size: 18px;
		}

		.poll__option {
			font-size: 15px;
		}
	}

	/* Not much height: drop the vote count and compress the rows. */
	@container widget (max-height: 220px) {
		.poll {
			padding: 8px 14px;
		}

		.poll__label {
			display: none;
		}

		.poll__question {
			margin-bottom: 6px;
			font-size: 18px;
		}

		.poll__options {
			gap: 3px;
		}

		.poll__option {
			padding: 2px 8px;
			font-size: 15px;
		}
	}

	/* Tall column: bigger type, and the answers stretch to fill the height. */
	@container widget (min-height: 480px) and (max-width: 899.98px) {
		.poll {
			justify-content: flex-start;
			padding: 20px;
		}

		.poll__label {
			font-size: 18px;
		}

		.poll__question {
			margin-bottom: 18px;
			font-size: 36px;
		}

		.poll__options {
			min-height: 0;
			flex: 1;
			gap: 10px;
			grid-auto-rows: 1fr;
		}

		.poll__option {
			align-items: center;
			padding: 0 16px;
			font-size: 26px;
		}
	}

	/* Full-width banner: question on the left, answers side by side. */
	@container widget (min-width: 900px) {
		.poll {
			display: grid;
			align-content: center;
			align-items: center;
			column-gap: 28px;
			grid-template-columns: minmax(280px, 1fr) 3fr;
		}

		.poll__label {
			grid-column: 1;
		}

		.poll__question {
			margin: 0;
			font-size: 30px;
			grid-column: 1;
		}

		.poll__options {
			grid-column: 2;
			grid-row: 1 / span 2;
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.poll__option {
			padding: 14px 12px;
			font-size: 20px;
		}
	}

	/* Thin banner: everything on one line. */
	@container widget (min-width: 900px) and (max-height: 110px) {
		.poll__question {
			font-size: 22px;
		}

		.poll__option {
			padding: 6px 10px;
			font-size: 17px;
		}
	}
</style>
