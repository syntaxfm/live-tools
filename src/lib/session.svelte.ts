import { authClient } from '$lib/auth-client';

// App-wide client identity, derived from the Better Auth JWT's signed claims. This is
// display/affordance state only — authorization is enforced server-side (form actions) and
// in the Durable Object (which verifies the JWT against the live JWKS). Replaces the Jazz
// session as the identity primitive components read.
export interface SessionClaims {
	id: string;
	name: string;
	email: string;
	image: string | null;
	githubUsername: string | null;
	is_admin: boolean;
}

let claims = $state<SessionClaims | null>(null);

function decodeClaims(token: string): SessionClaims | null {
	try {
		const [, payload] = token.split('.');
		const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
			claims?: Record<string, unknown>;
		};
		const record = json.claims;
		if (!record || typeof record.id !== 'string') {
			return null;
		}
		return {
			id: record.id,
			name: typeof record.name === 'string' ? record.name : '',
			email: typeof record.email === 'string' ? record.email : '',
			image: typeof record.image === 'string' ? record.image : null,
			githubUsername: typeof record.githubUsername === 'string' ? record.githubUsername : null,
			is_admin: record.is_admin === true
		};
	} catch {
		return null;
	}
}

// Fetch the current JWT and update the shared session. Called once at app load (root
// layout) and after sign-out.
export async function refreshSession(): Promise<void> {
	try {
		const result = await authClient.token();
		const token = result?.data?.token;
		claims = token ? decodeClaims(token) : null;
	} catch {
		claims = null;
	}
}

export function clearSession(): void {
	claims = null;
}

// Reactive accessor. The returned object's getters read module-level $state, so
// `$derived(session.isAdmin)` in a component stays reactive.
export function getClientSession(): {
	readonly claims: SessionClaims | null;
	readonly userId: string | null;
	readonly isAdmin: boolean;
	readonly isLoggedIn: boolean;
} {
	return {
		get claims() {
			return claims;
		},
		get userId() {
			return claims?.id ?? null;
		},
		get isAdmin() {
			return claims?.is_admin === true;
		},
		get isLoggedIn() {
			return claims !== null;
		}
	};
}
