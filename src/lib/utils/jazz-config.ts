import type { DbConfig } from 'jazz-tools';

interface CreateJazzConfigOptions {
	isDev: boolean;
	jwtToken: string | null;
	localFirstSecret: string | null;
}

export function createJazzConfig({
	isDev,
	jwtToken,
	localFirstSecret
}: CreateJazzConfigOptions): DbConfig {
	const appId = import.meta.env.PUBLIC_JAZZ_APP_ID;
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

	if (jwtToken) {
		config.jwtToken = jwtToken;
		config.driver = { type: 'memory' };
	} else if (localFirstSecret) {
		config.secret = localFirstSecret;
	}

	return config;
}
