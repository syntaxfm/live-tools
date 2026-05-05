export type OverlayFeature =
	| 'lower-thirds'
	| 'ticker'
	| 'featured-submission'
	| 'submissions'
	| 'feud-collect'
	| 'feud-board';

type OverlayFeaturePath = `/overlay/${OverlayFeature}`;

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
		path: '/overlay/submissions'
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
