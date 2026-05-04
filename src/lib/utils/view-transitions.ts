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
	await transition.finished;
}

export function getViewTransitionName(prefix: string, value: string): string {
	const safeValue = value.replace(/[^a-zA-Z0-9_-]/g, '-');

	return `${prefix}-${safeValue}`;
}
