import type { ShowHost } from '$lib/schema';

export const LOWER_THIRD_DISPLAY_MS = 10000;

// Sentinel id assigned to `shows.activeLowerThirdShowHostId` when the lower-third
// is intentionally hidden. The runtime broadcast/clear path uses this in place of
// `null` because setting the optional ref to null does not behave reliably in Jazz
// for live updates. See docs/adr/0001-lower-third-sentinel-uuid.md.
export const HIDDEN_LOWER_THIRD_SHOW_HOST_ID = '00000000-0000-4000-8000-000000000001';

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

export function getLowerThirdTitle(host: ShowHost | null): string {
	return host?.lowerThirdTitle?.trim() ?? '';
}

export function getLowerThirdAsset(host: ShowHost | null): LowerThirdAsset {
	const normalizedName = host?.displayName.toLowerCase();

	return (
		LOWER_THIRD_ASSETS.find((asset) => normalizedName?.includes(asset.key)) ??
		DEFAULT_LOWER_THIRD_ASSET
	);
}
