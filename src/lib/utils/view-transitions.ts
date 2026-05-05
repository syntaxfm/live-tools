type ViewTransitionUpdate = () => void | Promise<void>;

export async function updateWithViewTransition(update: ViewTransitionUpdate): Promise<void> {
	if (typeof document === 'undefined' || typeof window === 'undefined') {
		await update();
		return;
	}

	const startViewTransition =
		'startViewTransition' in document && typeof document.startViewTransition === 'function'
			? document.startViewTransition.bind(document)
			: null;
	const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (!startViewTransition || shouldReduceMotion) {
		await update();
		return;
	}

	const transition = startViewTransition(update);
	logViewTransitionError(transition.ready, 'View transition was not ready');
	logViewTransitionError(transition.finished, 'View transition failed');

	await settleViewTransitionUpdate(transition.updateCallbackDone);
}

export function getViewTransitionName(prefix: string, value: string): string {
	const safeValue = value.replace(/[^a-zA-Z0-9_-]/g, '-');

	return `${prefix}-${safeValue}`;
}

function isSkippedViewTransitionError(error: unknown): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}

function logViewTransitionError(promise: Promise<void>, message: string): void {
	promise.catch((caughtError: unknown) => {
		if (!isSkippedViewTransitionError(caughtError)) {
			console.error(message, caughtError);
		}
	});
}

async function settleViewTransitionUpdate(promise: Promise<void>): Promise<void> {
	try {
		await promise;
	} catch (caughtError) {
		if (!isSkippedViewTransitionError(caughtError)) {
			throw caughtError;
		}
	}
}
