import { createDb } from 'jazz-tools';
import type { Db } from 'jazz-tools';
import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import { app } from '$lib/schema';

let dbPromise: Promise<Db> | null = null;

async function createAuthJazzDb(): Promise<Db> {
	const appId =
		privateEnv.APP_ID || publicEnv.PUBLIC_JAZZ_APP_ID || process.env.PUBLIC_JAZZ_APP_ID;
	const serverUrl =
		privateEnv.SYNC_SERVER_URL ||
		publicEnv.PUBLIC_JAZZ_SERVER_URL ||
		process.env.PUBLIC_JAZZ_SERVER_URL;
	const adminSecret =
		privateEnv.JAZZ_ADMIN_SECRET || process.env.JAZZ_ADMIN_SECRET || privateEnv.BACKEND_SECRET;
	const backendSecret = privateEnv.BACKEND_SECRET || process.env.BACKEND_SECRET || adminSecret;

	if (!appId) {
		throw new Error('APP_ID or PUBLIC_JAZZ_APP_ID is required for Jazz auth');
	}

	if (!serverUrl) {
		throw new Error('SYNC_SERVER_URL or PUBLIC_JAZZ_SERVER_URL is required for Jazz auth');
	}

	if (!backendSecret) {
		throw new Error('JAZZ_ADMIN_SECRET or BACKEND_SECRET is required for Jazz auth');
	}

	if (dev) {
		const { createJazzContext } = await import('jazz-tools/backend');

		return createJazzContext({
			appId,
			driver: { type: 'memory' },
			serverUrl,
			env: 'dev',
			userBranch: 'main',
			backendSecret,
			tier: 'global'
		}).asBackend(app);
	}

	return createDb({
		appId,
		driver: { type: 'memory' },
		serverUrl,
		env: 'prod',
		userBranch: 'main',
		adminSecret: adminSecret || backendSecret
	});
}

export async function authJazzDb(): Promise<Db> {
	dbPromise ??= createAuthJazzDb();
	return dbPromise;
}
