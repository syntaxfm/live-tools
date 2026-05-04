import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getPageTitle } from '$lib/server/page-title';

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');

	if (!targetUrl) {
		return json({ error: 'URL required' }, { status: 400 });
	}

	try {
		return json({
			title: (await getPageTitle(targetUrl)) ?? null
		});
	} catch (error) {
		console.error('Unable to resolve page title', error);
		return json({ error: 'Unable to resolve page title' }, { status: 422 });
	}
};
