import type { Action } from 'svelte/action';

const TICKER_SCROLL_PIXELS_PER_SECOND = 64;
const MINIMUM_TICKER_SCROLL_SECONDS = 50;
const MAXIMUM_TICKER_SCROLL_SECONDS = 180;

function clampTickerScrollSeconds(seconds: number): number {
	return Math.min(MAXIMUM_TICKER_SCROLL_SECONDS, Math.max(MINIMUM_TICKER_SCROLL_SECONDS, seconds));
}

function getTickerScrollSeconds(width: number): number {
	return clampTickerScrollSeconds(width / TICKER_SCROLL_PIXELS_PER_SECOND);
}

export const tickerScrollDuration: Action<HTMLElement> = (node) => {
	const content = node.parentElement;

	if (!content) {
		return;
	}

	const setDuration = () => {
		const width = node.getBoundingClientRect().width;

		if (width > 0) {
			content.style.setProperty('--ticker-duration', `${getTickerScrollSeconds(width)}s`);
		}
	};

	const resizeObserver = new ResizeObserver(setDuration);

	resizeObserver.observe(node);
	setDuration();

	return {
		destroy() {
			resizeObserver.disconnect();
			content.style.removeProperty('--ticker-duration');
		}
	};
};
