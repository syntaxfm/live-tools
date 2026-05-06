import { createAuthClient } from 'better-auth/svelte';
import { jwtClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [jwtClient()]
});
