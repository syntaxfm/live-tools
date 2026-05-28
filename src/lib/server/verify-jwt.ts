import { createRemoteJWKSet, jwtVerify } from 'jose';

// The signed claims Better Auth's JWT plugin puts under `claims` (see definePayload in
// auth.ts). The Durable Object verifies the JWT against the live JWKS and classifies the
// connection from these — this is the "JWKS verification on the DO" the migration requires.
export interface SessionClaims {
	id: string;
	name: string;
	email: string;
	image: string | null;
	githubUsername: string | null;
	is_admin: boolean;
}

// One remote JWKS per origin; jose caches the fetched keys internally.
const jwksByOrigin = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(origin: string): ReturnType<typeof createRemoteJWKSet> {
	let jwks = jwksByOrigin.get(origin);
	if (!jwks) {
		jwks = createRemoteJWKSet(new URL('/api/auth/jwks', origin));
		jwksByOrigin.set(origin, jwks);
	}
	return jwks;
}

export async function verifySessionToken(
	token: string,
	origin: string
): Promise<SessionClaims | null> {
	try {
		const { payload } = await jwtVerify(token, jwksFor(origin), {
			issuer: origin,
			audience: origin
		});
		const claims = payload.claims;
		if (!claims || typeof claims !== 'object') {
			return null;
		}
		const record = claims as Record<string, unknown>;
		if (typeof record.id !== 'string') {
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
