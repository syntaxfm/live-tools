### Stack

- **SvelteKit** with Svelte 5 runes, `@sveltejs/adapter-cloudflare`, CSR-only (`src/routes/+layout.ts` sets `ssr = false` globally).
- **Cloudflare Workers + Durable Objects + D1.** The whole app runs on Workers. Live "room state" lives in a per-show Durable Object (`ShowRoom`); a singleton `ShowDirectory` DO announces the live show. Durable, cross-show "registry" data lives in **D1** (SQLite) via **Drizzle** (`drizzle-orm/d1`).
- **Better Auth** (GitHub OAuth → JWT/JWKS) on D1 via the Drizzle adapter. A per-request `createAuth(env)` factory in `src/lib/server/auth.ts` (NOT a module-level singleton — the D1 binding is per-request `event.platform.env`).
- **Sentry**: client via `@sentry/sveltekit` (`hooks.client.ts`); server via `@sentry/cloudflare` (`withSentry` wraps the worker in `src/worker.ts`; `hooks.server.ts` `handleError` captures).
- **Package manager**: `pnpm@10` (run binaries with `pnx`). **Scripts**: `dev`, `build`, `check`, `lint`, `format`, `auth:schema`, `cf:types`, `db:generate`, `db:migrate`, `db:reset`, `cf:dev`.
- See `CONTEXT.md` (domain language: Registry vs Room State, Overlay, etc.) and `docs/jazz-to-cloudflare-migration.md` (how this stack came to be; intentional deviations).

### References

- Durable Objects (SQLite, Hibernation API, Alarms): https://developers.cloudflare.com/durable-objects/
- D1: https://developers.cloudflare.com/d1/
- Better Auth Drizzle adapter: https://www.better-auth.com/docs/adapters/drizzle
- Drizzle ORM (SQLite/D1): https://orm.drizzle.team/
- SvelteKit: https://svelte.dev/docs/kit
- ADR 0002 (Hibernation + Alarm auto-hide), ADR 0003 (dev-auth bypass) in `docs/adr/`.

### Runtime + worker entry

- The dev/verification loop is **`pnpm build` + `wrangler dev`** (real workerd, real local D1, real local DOs). `wrangler dev` reads `.dev.vars`. Run on port 8787 → set `ORIGIN=http://localhost:8787`. (Pure `vite dev` cannot run the DO-exporting worker; see the migration doc's deviations.)
- `adapter-cloudflare` writes its worker to the config it is given (`wrangler.adapter.jsonc`). The real `main` is `src/worker.ts` — a custom entry that imports the adapter output, **re-exports `ShowRoom`/`ShowDirectory`**, and wraps the fetch handler with `@sentry/cloudflare`. It also routes `/_ws/room/:showId` and `/_ws/directory` WebSocket upgrades to the DOs.
- After changing `wrangler.jsonc` (bindings), run `pnpm cf:types` (regenerates `worker-configuration.d.ts` and repoints DO type refs at their source).

### Data model: Registry (D1) vs Room State (Durable Object)

- **Registry (D1, Drizzle):** Better Auth tables + `shows` (incl. `status`, with a partial unique index enforcing one `live` show) + `showHosts` + `hostLinks`. Schema in `src/lib/server/db/auth-schema.ts` (regenerate-able via `pnpm auth:schema`) and `src/lib/server/db/registry-schema.ts` (hand-authored). Migrations: `pnpm db:generate` → `pnpm db:migrate` (local D1). Client-facing registry shapes are in `src/lib/components/shows/registry-types.ts` (never import `$lib/server/*` into client code).
- **Room State (per-show `ShowRoom` DO SQLite):** ticker, active lower-third, `submissionsOpen`, submissions, votes, featured. The DO is the source of truth, persists to its own SQLite (survives hibernation), verifies the JWT against the live JWKS on connect (`src/lib/server/verify-jwt.ts`), classifies the socket anonymous/viewer/admin (stashed via `serializeAttachment()`), enforces permissions in its message handler, and sends each consumer a **pre-shaped snapshot** on connect and on every change. No in-DO `setInterval`/`setTimeout` — the lower-third auto-hide is a single Alarm (ADR 0002).
- The wire protocol (snapshot shape + message unions) is `src/lib/components/shows/room-protocol.ts`, shared by the DO and the client store.

### Reading data

- **Room state:** read the WebSocket store, not a query engine. `ShowRoomStore` (a specific show, optionally authenticated) and `LiveShowStore` (follows the live show via the directory) in `src/lib/components/shows/room.svelte.ts`. Components read fields off `store.snapshot` (e.g. `room.snapshot?.ticker`); overlays use `LiveShowStore`, the admin console + homepage instantiate the store and pass it down. Connect/disconnect in `onMount` (overlays/homepage) or a route-param `$effect` (admin console, which is reused across shows). Surface `store.error`.
- **Registry:** load it in a `+page.server.ts` `load` with `drizzle(platform.env.DB)`; the page reads `data`. (`ssr = false` does not disable server `load` — it still runs in the worker.)
- **Identity:** `getClientSession()` from `src/lib/session.svelte` (claims decoded from the JWT; reactive). `session.isAdmin` / `session.userId` / `session.isLoggedIn` are display/affordance state — authorization is server/DO-side.

### Writing data — two paths

- **Room writes** (ticker, lower-third broadcast/hide, submissions-open, submit, moderate, feature, vote) are **typed messages to the show DO** over the open socket: `room.send({ type: '...' })`. The DO authorizes each from the verified JWT class. Viewers (not just admins) write over their already-open read socket; overlays are anonymous and rejected on any write.
- **Registry writes** (create/delete show, status, host assignment, host titles, ban/unban) are **SvelteKit form actions** in `+page.server.ts`, with a server-side admin gate via `requireAdmin(locals)` (`src/lib/server/require-admin.ts`), writing D1 with Drizzle. This **inverts** the old "no endpoints for app data" rule — that only held because Jazz let the client write safely.
- **DO↔D1 coherence:** a `status→live` form action does the atomic D1 write, then `announceShowStatus` (`src/lib/server/show-status.ts`) hydrates the room from the registry (`ShowRoom.activate`) and announces it to the directory. Registry edits while live write-through to the DO (`syncHosts`, `setBan`). The hot vote/submit path reads only the DO's SQLite, never D1.
- API routes (`+server.ts`) are for true server-only boundaries: auth/JWT bridge, secrets, external APIs (today the auth routes + `src/routes/api/page-title/+server.ts`). DO WebSocket upgrades are routed in `src/worker.ts`, not via SvelteKit endpoints.

### Auth and Roles

- `createAuth(env)` (per request, in `hooks.server.ts` from `event.platform.env`) builds Better Auth on D1 via the Drizzle adapter, with the GitHub provider, the JWT/JWKS plugin, `additionalFields` (`roles`, `githubUsername`, `banned`, `githubUserId`), `mapProfileToUser`, and `definePayload`. `hooks.server.ts` populates `event.locals.{auth,user,session}`.
- Admin source of truth: `ADMIN_GITHUB_USERNAMES` (comma/space-separated). On GitHub sign-in, `mapProfileToUser` → `isAdminGithubUser` (`src/lib/server/github-auth.ts`) writes `roles: ['viewer','admin','host']` for admins, else `['viewer']`. `definePayload` derives `claims.is_admin` from `user.roles.includes('admin')`. Full claims: `{ id, name, email, image, githubUsername, is_admin }`.
- **Authorization** is the server-side admin gate (registry form actions) and the DO's JWKS verification + connection class (room writes). UI affordances gate on `getClientSession().isAdmin` (a display claim), never the authority.
- **Dev-auth bypass** (ADR 0003): `DEV_AUTH=1` in `.dev.vars` enables `/dev-login?role=admin|viewer`, which seeds two users and mints a real JWKS-signed JWT through the existing pipeline. Never gate this on the framework `dev` flag (false under workerd) and never set `DEV_AUTH` in a deployed env.
- When debugging non-admin: check (1) the JWT claims (`/api/auth/token`), (2) the GitHub login vs `ADMIN_GITHUB_USERNAMES`, (3) `roles` on the `better_auth_user` D1 row.

## Svelte

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### SvelteKit Patterns

- Routes are organized into groups: `(app)/(protected)` for authenticated app UI, `(auth)` for login, `(overlay)` for transparent OBS browser-source overlays, `(public)` for unauthenticated pages.
- Use nested SvelteKit layouts for shared route UI instead of thin wrapper components.
- Components own their own data: read `getClientSession()` for identity and the room store's `snapshot` for room state directly where used. The parent that owns the show's room connection (admin console page, homepage) instantiates the store and passes it down; overlays own a `LiveShowStore`. Do not prop-drill route params through pass-through components.
- Props are for real generic boundaries (e.g. `let { show }: { show: Show } = $props();`, `let { room }: { room: ShowRoomStore } = $props();`). Read `getClientSession()` directly at feature/state boundaries.
- Use Svelte 5 runes in component state. `$state` for local reactive state, `$derived` for computed values. Do not use `$derived`/`$derived.by` for rename-only aliases of existing values.
- Avoid `$effect` except for synchronizing an external resource with reactive state — e.g. the admin console route re-points its room socket when `data.show.id` changes via `$effect`. Never use it for derived state.
- Event handlers: `onclick={handler}` or `onclick={() => handler(id)}` for capturing an argument. Do not write `onclick={() => { void handler(); }}`.
- Form/input handlers (`onsubmit`, `onchange`, `oninput`) extract values via the typed `event.currentTarget` (with `instanceof` narrowing where the value comes from the DOM). See `ShowStatePanel.svelte` for the pattern.
- Type-safe overlay routing: extend `OverlayFeature` in `src/lib/utils/overlays.ts` and add to `OVERLAY_FEATURES`. The `OverlayFeaturePath` template-literal type keeps paths in sync.
- The root `+layout.svelte` awaits `refreshSession()` at the top level to establish client identity from the JWT before rendering. Do not reintroduce SSR — `+layout.ts` exports `ssr = false` for a reason.

### Styling

- The visual system is custom CSS in `src/app.css` with CSS custom properties (`--color-accent`, `--color-danger`, `--color-success`, `--radius-md`, `--shadow-raised-md`, `--transition-fast`, etc.) and Space Grotesk / Space Mono fonts.
- Use **data attributes** for variants, not class proliferation: `data-depth="medium"`, `data-state="warning"`, `data-variant="danger"`, `data-active="true"`. Selectors in component scoped styles target these (`section[data-depth='medium']`, `li[data-active='true']`).
- Component-scoped `<style>` blocks own their layout. Keep structural CSS (grid, flex, sizing, spacing) in the component; design tokens in `app.css`.
- Overlays render at 1920×1080 with transparent background via `html:has(.overlay-root)` in `app.css`. Overlay components live in `src/lib/components/shows/*Overlay.svelte` and routes under `(overlay)/overlay/<feature>/`.
- Do not add a `button` class to a `<button>` element. Style buttons via `data-variant` or scoped selectors.

### Utilities and Feature Colocation

- All shared/pure utilities live in `src/lib/utils/`. One pool — do not create new utility folders.
- Current utils: `github-usernames.ts`, `lower-thirds.ts`, `overlays.ts`, `page-title.ts`, `roles.ts`, `shows.ts`, `submissions.ts`, `ticker-messages.ts`, `urls.ts`. Check here first and extend an existing file before adding a new one.
- Server-only helpers go in `src/lib/server/` (`auth.ts`, `github-auth.ts`, `page-title.ts`, `require-admin.ts`, `show-status.ts`, `verify-jwt.ts`, the Durable Objects `show-room.ts`/`show-directory.ts`, and the Drizzle schema under `db/`). Anything reachable from the worker bundle (the DOs and their imports) must use **relative** imports — wrangler's esbuild does not resolve `$lib`.
- App-wide client state lives at `src/lib/` (e.g. `session.svelte.ts`). Feature-specific stores (`room.svelte.ts`), types, components, and tests stay under `src/lib/components/<feature>/`. Do not place feature-specific files in global buckets.
- Never write a utility function inline in the file where it is used if it is generic/pure. Lift it to `src/lib/utils/`.

### TypeScript and Code Style

- `tsconfig.json` has `strict: true`, `allowJs: true`, `checkJs: true`. Preserve strict typing — no `any`, prefer `unknown` at trust boundaries, narrow before access.
- Use `import type` for type-only imports. Group imports as: node built-ins, external packages, internal modules (`$lib/...`, `$env/...`, `$app/...`).
- Never re-export code or types; always import from the source module.
- Naming: `PascalCase` components/types, `camelCase` variables/functions, `SCREAMING_SNAKE_CASE` top-level constants, `is*`/`has*`/`should*` for booleans (the codebase uses `is_admin` with underscore to mirror the signed JWT claim name).
- Add explicit return types on exported functions (`Promise<Show>`, `Promise<void>`, etc.).
- Error handling: log with context (`console.error('Unable to ...', error)`) and surface a user-facing message via local `$state`. Throw early on bad input with a clear message.
- Action files use option-object parameters (`interface CreateShowOptions { ... }`) rather than positional arguments.

### Testing

- There are no tests yet in this repo. When adding tests, colocate them with the feature (`*.test.ts` / `*.spec.ts` in `src/lib/components/<feature>/` or next to the util). Use `@testing-library/svelte` for component tests. Prefer role/text-based assertions. Keep tests deterministic and independent.

### Operational Rules

- **ALWAYS ASK BEFORE UPDATING the schema.** Changes to the Drizzle schema (`src/lib/server/db/registry-schema.ts`, `auth-schema.ts`) and the room-state shape / permissions in the Durable Objects (`src/lib/server/show-room.ts`, `room-protocol.ts`) require confirmation.
- Run the local app with `pnpm build` then `wrangler dev --port 8787` (or `pnpm cf:dev`). It serves on 8787 and reads `.dev.vars`.
- Do not run `pnpm db:reset` without asking — it wipes and re-migrates the local D1 (`.wrangler/state/v3/d1`), dropping all local users and shows.
- After auth-config changes, `pnpm auth:schema` regenerates the Drizzle auth schema; for any schema change run `pnpm db:generate` then `pnpm db:migrate`. After `wrangler.jsonc` binding changes run `pnpm cf:types`. After TS/Svelte edits run `pnpm check`.
