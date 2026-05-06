import { env } from '$env/dynamic/public';
import { env as serverEnv } from '$env/dynamic/private';
import { createJazzContext } from 'jazz-tools/backend';
import type { JazzContext } from 'jazz-tools/backend';

if (!serverEnv.BACKEND_SECRET) {
	throw new Error('BACKEND_SECRET is required for Jazz auth');
}

let context: JazzContext | null = null;

function createAuthJazzContext(): JazzContext {
	const appId = env.PUBLIC_JAZZ_APP_ID;

	if (!appId) {
		throw new Error('APP_ID or PUBLIC_JAZZ_APP_ID is required for Jazz auth');
	}

	return createJazzContext({
		appId,
		driver: { type: 'memory' },
		serverUrl: env.PUBLIC_JAZZ_SERVER_URL || 'https://localhost:7012/',
		env: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
		userBranch: 'main',
		backendSecret: serverEnv.BACKEND_SECRET,
		tier: 'global'
	});
}

export function authJazzContext(): JazzContext {
	context ??= createAuthJazzContext();
	return context;
}
