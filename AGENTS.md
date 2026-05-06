### Jazz v2 and SvelteKit References

- Start with the Jazz docs map when Jazz APIs are unclear: https://jazz.tools/llms.txt
- Jazz overview: https://jazz.tools/docs
- Client setup: https://jazz.tools/docs/getting-started/client-setup
- Auth provider integration: https://jazz.tools/docs/recipes/auth/auth-provider-integration
- Sessions: https://jazz.tools/docs/auth/sessions
- Queries and subscriptions: https://jazz.tools/docs/reading/queries
- Filters, sorting, and pagination: https://jazz.tools/docs/reading/filters-and-sorting
- Writing data: https://jazz.tools/docs/writing/writing-data
- Defining tables: https://jazz.tools/docs/schemas/defining-tables
- Column types: https://jazz.tools/docs/schemas/column-types
- Permissions: https://jazz.tools/docs/auth/permissions
- SvelteKit docs: https://svelte.dev/docs/kit

### Jazz Data Model

- Jazz is the application database and sync layer. All app data that the client reads or mutates should go through Jazz.
- Keep schema changes in `src/lib/schema.ts`.
- Keep permission rules in `src/lib/permissions.ts`.
- Keep feature-specific Jazz query helpers, mutation helpers, types, and tests colocated in that feature folder under `src/lib/components/<feature>/`.
- Do not add app-domain state to Better Auth tables. Better Auth tables are implementation detail tables for the auth bridge.
- After schema or permission changes, run `pnpm auth:validate`. Run `pnpm check` for TypeScript/Svelte changes.

### Querying Data

- Use `QuerySubscription` from `jazz-tools/svelte` for live Svelte reads.
- Query through the typed Jazz app from `src/lib/schema.ts`, for example `app.shows.where({})`.
- To get current user use `	const session = getSession(); const user = $derived(session?.claims ?? null);`
- Don't check loading and don't have loading states, just check for if data existence.
- Use `undefined` to skip conditional queries until required ids or session data exist.
- Handle the initial `subscription.current` loading value intentionally. Prefer `subscription.current ?? []` for list UI unless a real loading state matters.
- Keep query construction in colocated `*.svelte.ts` helpers when it is shared by multiple components.
- Do not read client app state from server load data when the same state belongs in Jazz. Server load data is fine for static route setup or non-Jazz integration boundaries.

### Mutating Data

- Use Jazz writes for app data: `db.insert`, `db.update`, and `db.delete`.
- In Svelte components, get the database from Jazz context with `getDb()` and pass `Db` into colocated mutation helpers when that keeps components small.
- Treat Jazz writes as local-first. Use `.wait({ tier: 'global' })` when the UI or next step needs confirmed global sync.
- Put reusable mutation logic in feature action files like `src/lib/components/shows/show-actions.ts`.
- Never add REST endpoints or SvelteKit form actions for ordinary app data mutations when Jazz can perform the write directly.
- API routes are for true server-only boundaries, such as auth/JWT bridge work, secrets, external APIs, or server-owned integrations.
- Enforce authorization in Jazz permissions first. UI checks are for affordances, not authority.

### Auth and Roles

- App state and identity are Jazz-first. Client UI should read the current app user from Jazz queries or Jazz session state, not from Better Auth session data.
- Better Auth is only the auth bridge: GitHub sign-in/sign-out, issuing the JWT, and exposing JWKS for Jazz JWT verification.
- The Svelte client provider lives in `src/lib/components/auth/JazzAuthProvider.svelte` and should create the Jazz client with the Better Auth JWT.
- Client-side session data should come from Jazz APIs such as `getJazzContext().session` or `getSession()`.
- Current app-user profile data should come from Jazz `appUsers` queries, matching `externalUserId` to the Jazz session `user_id`.
- Admin access is not stored in `appUsers`. Do not add DB-backed role fields or gate admin UI/Jazz permissions from mutable app-user data.
- Admin status comes from `ADMIN_GITHUB_USER_IDS`. The server maps the signed-in GitHub OAuth profile to `githubUserId`/`githubUsername`, then writes `claims.githubUserId`, `claims.githubUsername`, and `claims.isAdmin` into the Better Auth JWT.
- Jazz permissions should enforce admin access with the Jazz session claim, e.g. `session.where({ 'claims.isAdmin': true })`.
- UI labels may display `admin` or `viewer` from `getJazzContext().session?.claims.isAdmin`, but the authoritative check remains the signed Jazz session claim.
- `appUsers` is profile/application identity data only: `externalUserId`, `githubUsername`, display name, avatar, and ban state. It is not the role source of truth.
- When debugging a user showing as non-admin, check the JWT/Jazz session claims first, then whether the GitHub numeric id matches `ADMIN_GITHUB_USER_IDS`.

### SvelteKit Patterns

- Use Svelte 5 runes in component state, but do not use `$derived` for rename-only aliases or side effects.
- Prefer `getJazzContext().session` directly where session claims are needed.
- Prefer nested SvelteKit layouts for shared route UI instead of thin wrapper components.
- Components should read Jazz managers/subscriptions directly when they own that view.
- Use props at real generic boundaries only; do not prop-drill route params or Jazz manager state through pass-through components.

ALWAYS ASK BEFORE UPDATING the schema!!
Do not start additional jazz dev processes use the already running one
