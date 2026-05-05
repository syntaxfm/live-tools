import { PUBLIC_JAZZ_APP_ID } from '$env/static/public';
import { createJazzContext } from 'jazz-tools/backend';
import type { JazzContext } from 'jazz-tools/backend';

if (!process.env.BACKEND_SECRET) {
	throw new Error('BACKEND_SECRET is required for Jazz auth');
}

let context: JazzContext | null = null;

function createAuthJazzContext(): JazzContext {
	const appId = PUBLIC_JAZZ_APP_ID;
	const serverUrl = process.env.SYNC_SERVER_URL || process.env.PUBLIC_JAZZ_SERVER_URL;

	if (!appId) {
		throw new Error('APP_ID or PUBLIC_JAZZ_APP_ID is required for Jazz auth');
	}

	if (!serverUrl) {
		throw new Error('SYNC_SERVER_URL or PUBLIC_JAZZ_SERVER_URL is required for Jazz auth');
	}

	return createJazzContext({
		appId,
		driver: { type: 'memory' },
		serverUrl,
		env: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
		userBranch: 'main',
		backendSecret: process.env.BACKEND_SECRET,
		tier: 'global'
	});
}

export function authJazzContext(): JazzContext {
	context ??= createAuthJazzContext();
	return context;
}
