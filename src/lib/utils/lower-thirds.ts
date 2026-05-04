import type { LowerThirdOverlay, ShowHost } from '$lib/schema';

export const LOWER_THIRD_DISPLAY_MS = 10000;

interface LowerThirdAsset {
	key: string;
	src: string;
	tone: 'accent' | 'coral' | 'info' | 'purple';
}

const LOWER_THIRD_ASSETS: readonly LowerThirdAsset[] = [
	{
		key: 'cj',
		src: '/assets/lower-thirds/CJ.svg',
		tone: 'accent'
	},
	{
		key: 'randy',
		src: '/assets/lower-thirds/Randy.svg',
		tone: 'coral'
	},
	{
		key: 'scott',
		src: '/assets/lower-thirds/Scott.svg',
		tone: 'info'
	},
	{
		key: 'wes',
		src: '/assets/lower-thirds/Wes.svg',
		tone: 'purple'
	}
];

const DEFAULT_LOWER_THIRD_ASSET = LOWER_THIRD_ASSETS[0];

export function getLowerThirdTitle(host: ShowHost): string {
	return host.lowerThirdTitle?.trim() ?? '';
}

export function getLowerThirdAsset(host: ShowHost): LowerThirdAsset {
	const normalizedName = host.displayName.toLowerCase();

	return (
		LOWER_THIRD_ASSETS.find((asset) => normalizedName.includes(asset.key)) ??
		DEFAULT_LOWER_THIRD_ASSET
	);
}

export function getCurrentLowerThirdOverlay(
	overlays: readonly LowerThirdOverlay[]
): LowerThirdOverlay | null {
	return [...overlays].sort(compareLowerThirdOverlaysByRecency)[0] ?? null;
}

export function isLowerThirdBroadcastActive(updatedAt: Date, now = new Date()): boolean {
	return now.getTime() - new Date(updatedAt).getTime() < LOWER_THIRD_DISPLAY_MS;
}

function compareLowerThirdOverlaysByRecency(
	first: LowerThirdOverlay,
	second: LowerThirdOverlay
): number {
	return (
		new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime() ||
		second.id.localeCompare(first.id)
	);
}
