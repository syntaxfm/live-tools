import { env } from '$env/static/public';
import type { DbConfig } from 'jazz-tools';

type JazzStorageMode = 'default' | 'memory';

interface CreateJazzConfigOptions {
	isDev: boolean;
	jwtToken: string | null;
	localFirstSecret: string | null;
	storageMode?: JazzStorageMode;
}

export function createJazzConfig({
	isDev,
	jwtToken,
	localFirstSecret,
	storageMode = 'default'
}: CreateJazzConfigOptions): DbConfig {
	const appId = env.PUBLIC_JAZZ_APP_ID;
	console.log(appId);
	const serverUrl = import.meta.env.PUBLIC_JAZZ_SERVER_URL;

	if (!appId) {
		throw new Error('PUBLIC_JAZZ_APP_ID is required for Jazz');
	}

	if (!serverUrl) {
		throw new Error('PUBLIC_JAZZ_SERVER_URL is required for Jazz');
	}

	const config: DbConfig = {
		appId,
		env: isDev ? 'dev' : 'prod',
		userBranch: 'main',
		serverUrl
	};

	if (storageMode === 'memory' || jwtToken) {
		config.driver = { type: 'memory' };
	}

	if (jwtToken) {
		config.jwtToken = jwtToken;
	} else if (localFirstSecret) {
		config.secret = localFirstSecret;
	}

	return config;
}
