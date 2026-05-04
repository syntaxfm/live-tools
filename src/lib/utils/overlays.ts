export type OverlayFeature =
	| 'lower-thirds'
	| 'ticker'
	| 'featured-submission'
	| 'submissions'
	| 'feud-collect'
	| 'feud-board';

type OverlayFeaturePath = '/submissions' | `/overlay/${Exclude<OverlayFeature, 'submissions'>}`;

interface OverlayFeatureInfo {
	feature: OverlayFeature;
	label: string;
	path: OverlayFeaturePath;
}

export const OVERLAY_FEATURES: readonly OverlayFeatureInfo[] = [
	{
		feature: 'lower-thirds',
		label: 'Lower thirds',
		path: '/overlay/lower-thirds'
	},
	{
		feature: 'ticker',
		label: 'Ticker',
		path: '/overlay/ticker'
	},
	{
		feature: 'featured-submission',
		label: 'Featured submission',
		path: '/overlay/featured-submission'
	},
	{
		feature: 'submissions',
		label: 'Submissions',
		path: '/submissions'
	},
	{
		feature: 'feud-collect',
		label: 'Feud collect',
		path: '/overlay/feud-collect'
	},
	{
		feature: 'feud-board',
		label: 'Feud board',
		path: '/overlay/feud-board'
	}
];

export function getOverlayLabel(feature: OverlayFeature): string {
	return OVERLAY_FEATURES.find((overlay) => overlay.feature === feature)?.label ?? feature;
}
