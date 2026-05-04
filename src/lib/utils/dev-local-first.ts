const DEV_LOCAL_FIRST_SECRET_KEY = 'pole_dev_local_first_secret';

export function getDevLocalFirstSecret(): string {
	const existingSecret = localStorage.getItem(DEV_LOCAL_FIRST_SECRET_KEY);

	if (existingSecret) {
		return existingSecret;
	}

	const secret = createLocalFirstSecret();
	localStorage.setItem(DEV_LOCAL_FIRST_SECRET_KEY, secret);
	return secret;
}

function createLocalFirstSecret(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);

	let binary = '';

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}
