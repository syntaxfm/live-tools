# Migrate off Jazz to a Cloudflare-native stack

Status: **done.** Owner: Scott. Jazz is fully removed; the app runs on
`adapter-cloudflare` + Workers + per-show Durable Objects + D1, verified end to end under
`wrangler dev` (real local D1, real local DOs) via a headless browser.

## Deviations from the original plan (all intentional, all verified)

- **Raw Durable Objects + the WebSocket Hibernation API instead of PartyServer.** ADR 0002's
  requirements — `serializeAttachment()`, Alarm-based auto-hide, no in-DO timers — are the raw
  hibernation primitives PartyServer wraps; using them directly is more transparent, adds zero
  dependencies (serving the bus-factor goal), and matches the ADR's vocabulary.
- **The dev/verification loop is `wrangler dev` against `pnpm build`, not `vite dev` with
  `@cloudflare/vite-plugin`.** Exporting Durable Object classes from a SvelteKit worker needs a
  custom worker entry, which the released `adapter-cloudflare` (pre `sveltejs/kit#15627`, still
  draft) cannot reconcile with the plugin's `vite dev`. `wrangler dev` against the build gives
  the same real workerd + real local D1 + real local DOs the plan required (it is named as the
  parity check), so every behavior gate is met; only Vite HMR is given up. The plugin was removed
  as unused. When kit#15627 ships, re-adding it for the inner loop is the path.
- **Custom worker entry via two wrangler configs.** `adapter-cloudflare` writes its worker to its
  config's `main`, so `wrangler.adapter.jsonc` (adapter output) is kept distinct from
  `wrangler.jsonc` (`main = src/worker.ts`, the entry that re-exports the DOs and wraps Sentry).
- **The DO re-sends a full pre-shaped snapshot on every change** rather than diffing patches —
  room state is small; this is a simpler implementation of the same observable behavior.
- **`audienceSubmissionsOpen` and the active lower-third live in the DO** (room state), not D1;
  D1's `shows` keeps `status` for atomic single-live enforcement. Submission rows carry no
  denormalised author name (no current overlay renders one).

## Why

Jazz (`jazz-tools@2.0.0-alpha.46`) is the app database, sync layer, and permission
layer today. We are moving off it for four reasons, in roughly this order of weight:

1. **OBS local-store mismatch (concrete blocker).** Jazz is local-first and keeps
   CRDT state in the browser's local storage. OBS browser sources run a stripped
   Chromium where persistent storage is unreliable — it can be cleared on scene
   switches, the source is torn down and recreated, and the same overlay can run in
   multiple instances. This is close to a worst-case host for local-first, and it is
   what breaks today.
2. **Bus factor.** Jazz is alpha, niche knowledge held by one person. The team can
   own a Workers + Durable Objects + D1 stack (TypeScript, WebSockets, SQLite).
3. **CF-native.** We want compute and state on one platform.
4. **Maturity risk.** Betting production on an alpha.

The app is an online operator console plus read-only OBS overlays. There is no real
offline requirement and no concurrent-edit-merge problem (one operator drives a show;
overlays are read-only). So we do **not** need the hard parts of Jazz — local-first
and CRDTs — and a server-authoritative model is correct, not a compromise.

## Target architecture

Everything runs on Cloudflare. Jazz Cloud is the only non-CF dependency today and is
exactly what we are removing.

- **App runtime:** SvelteKit on Workers via `adapter-cloudflare`. (Today the active
  adapter is `adapter-node` despite prior notes — switching is real work, not done.
  `wrangler.jsonc` already targets the CF build output.)
- **Real-time show state:** one **Durable Object per show** (via PartyServer). The DO
  is the source of truth for that show's live state, persists to its own SQLite,
  verifies the Better Auth JWT on connect, enforces permissions in its message
  handlers, and fans out patches over WebSockets.
- **Overlays become stateless read-only WebSocket clients.** Connect → receive
  snapshot → apply patches. No local DB. If OBS clears storage or recreates the
  source, the overlay reconnects and re-syncs from the DO. This is what removes the
  current OBS failure by construction.
- **Client reactive layer:** a small WebSocket-backed Svelte store replaces
  `QuerySubscription` as the primitive components read from.

### Data placement (locked — matches Cloudflare best practice)

Cloudflare's own guidance: use Durable Objects for real-time coordination with D1 as
the persistence layer, and DOs for "per-customer SQL state."

- **D1** = durable, cross-cutting, queryable data: the Better Auth tables, plus the
  show _registry_ (the list admins browse, show metadata, host links). Read-heavy,
  queried across shows, benefits from D1 read replication.
- **Per-show Durable Object SQLite** = live room state: ticker, lower-thirds,
  submissions, votes, featured selection. Hot, bursty (live voting), strongly
  consistent, co-located with the WebSocket fan-out. Live vote bursts must not hit
  D1's write path.
- **Archival (optional, later):** when a show ends, flush its DO state to D1 if we
  ever want long-term cross-show reporting. Not needed day one.

### Auth (decisions locked)

- Move Better Auth's database from `jazzAdapter` to **D1 via Better Auth's official
  Drizzle adapter + `drizzle-orm/d1`**. Prefer the plain adapter over the third-party
  `better-auth-cloudflare` wrapper — more transferable for the team, one fewer core
  dependency. The wrapper's provisioning CLI is optional convenience only.
- **`nodejs_compat` stays on.** It is the standard CF-recommended flag exposing
  `node:*` built-ins; Better Auth does not run on Workers without it. It is not a
  sign of being "non-native." Already set in `wrangler.jsonc`.
- **No auth data migration.** One-time re-login is acceptable, so we create the D1
  tables fresh and let everyone sign in again. This removes the hardest migration step.
- Carried over unchanged (not DB-coupled): GitHub social provider, JWT/JWKS plugin,
  `additionalFields` (`roles`, `githubUsername`), `mapProfileToUser`, `definePayload`
  claims.
- One required structural change: refactor `auth.ts` from a module-level **singleton
  to a per-request `createAuth(env)` factory**, because the D1 binding lives on the
  request (`event.platform.env`) on Workers, not at import time. Call it per request
  in `hooks.server.ts`.
- **Dev-only auth bypass so the run needs no human (see
  `docs/adr/0003-dev-only-auth-bypass-for-autonomous-verification.md`).** Every DoD gate
  requires an authenticated session, but GitHub OAuth can't be driven headlessly and the
  agent needs _two_ identities (an **Admin** and a non-admin viewer, to prove the reject
  path). A sign-in path gated on `DEV_AUTH=1` (set only in local `.dev.vars`, never the
  framework `dev` flag, which is `false` under workerd) upserts a seeded admin + seeded
  viewer in D1 and mints a **real** JWT through the existing JWT/JWKS plugin +
  `definePayload`, so JWKS verification on the DO is exercised for real. The seeded viewer
  must present as `authMode: 'external'` (the marker `is_logged_in` and the submit/vote UI
  gate on) or those affordances won't render. **Consequence:** because the agent never
  touches GitHub OAuth, the verification loop needs only a dev `BETTER_AUTH_SECRET` and
  `DEV_AUTH=1` — `GITHUB_CLIENT_ID/SECRET` and `ADMIN_GITHUB_USERNAMES` can be dummy
  locally (the seeded admin's `roles` are set directly, not derived from the env list).

## Migration sequence (single branch — order is dependency-forced)

This is **not** kept shippable at every step. There are no live shows during the
migration window, so a broken `main` costs nothing. We do the whole thing on one
branch, rip the Jazz client out wholesale (no dual-path coexistence, no throwaway
glue), and merge once it's whole. What we **don't** get to do is reorder the work —
the sequence below is forced by two hard dependencies, not by a desire for
incrementalism:

- **Auth runs _through_ Jazz today** (`jazzAdapter`). The moment `jazz-tools` leaves,
  login has no database and the JWT stops being issued — and that JWT is what the DO
  verifies on connect. So auth must move to D1 _before_ Jazz can be removed.
- **Durable Objects only run on workerd.** No DO can be built or locally tested on
  `adapter-node`, and the per-request `createAuth(env)` D1 binding lives on
  `event.platform.env`, which only exists on the Workers runtime. So the adapter
  switch is a prerequisite for _both_ auth→D1 and the room primitive.

1. **Provision CF resources.** Create the D1 database with `wrangler d1 create <name>`
   and copy the generated `database_id` into a `d1_databases` binding in `wrangler.jsonc`
   (the `database_id` is required even for local dev). Declare the Durable Object class
   bindings + a `migrations` entry (`new_sqlite_classes`) for the per-show DO and the
   directory DO. Run `wrangler types` so the generated `Env`/binding types compile. No
   behavior change.
2. **Switch to `adapter-cloudflare` + a single workerd dev loop via
   `@cloudflare/vite-plugin`.** This is the prerequisite for everything after it — it's
   what exposes `platform.env` (for the D1 binding) and the workerd runtime (for DOs).
   Not a "deploy" step. Use `@cloudflare/vite-plugin` so `vite dev` runs the worker on
   workerd with **real** local D1, **real** local DOs, and HMR — one command for both
   iteration and verification (the DO/WS primitive is the #1 risk, so DOs must be real in
   the _inner_ loop, not just a final smoke test). `wrangler dev` against the `pnpm build`
   output remains only as a final runtime-parity check. Also in this step: **port server
   Sentry to `@sentry/cloudflare`** (wrap the worker) and delete the Node-only
   `instrumentation.server.ts` + the `experimental.instrumentation/tracing.server`
   adapter-node settings in `svelte.config.js`; client Sentry (`hooks.client.ts`) is
   unchanged. Without this the `pnpm build` gate fails or server error reporting silently
   no-ops on workerd.
3. **Move Better Auth off Jazz → D1.** Per-request `createAuth(env)` factory refactor,
   swap to the Drizzle/`drizzle-orm/d1` adapter, generate schema + migrations, create
   tables fresh (no data migration — everyone re-logs-in). Verify login and JWT claims
   end to end. Needs `platform.env` from step 2. Tooling pipeline: add `drizzle-orm` +
   `drizzle-kit`; add `drizzle.config.ts` (sqlite/d1 dialect) — `svelte.config.js` already
   includes it in the tsconfig. The D1 schema is the **better-auth-generated** auth tables
   (`auth:schema` repointed to `better-auth generate` for the Drizzle adapter) **plus a
   hand-authored registry schema** (`shows`, `showHosts`, `hostLinks`); `drizzle-kit
generate` emits SQL applied to local D1 with `wrangler d1 migrations apply <DB>
--local`. Repoint `db:reset` from the Jazz cache to resetting local D1. Drop the
   `auth:validate` (`jazz-tools validate`) script. **Also build the dev-auth bypass here**
   (it depends on Better Auth being on D1) — seed the admin + viewer users and the
   `DEV_AUTH`-gated sign-in; it is consumed by the verification from step 4 onward.
4. **Build the room primitive (Hibernation API) + directory DO + WS client store;
   prove it on the ticker.** Ticker is the simplest vertical (admin sets messages →
   overlay displays). Validates DO + JWT auth-on-connect + WS fan-out + the directory
   discovery path + the client store before committing the rest. This is the real risk
   and must be proven before porting anything else onto the primitive.
5. **Port remaining verticals:** lower-thirds, then submissions/votes/featured. Each
   moves its reads off `QuerySubscription` onto the WS store (the DO pre-shapes the
   payload — see Resolved design decisions), splits its writes into registry form actions
   vs DO messages, and relocates its permission checks into the DO handler. The viewer
   submit/vote surface is the **homepage** (`(public)/+page.svelte`), not `show/[id]`
   (a `TODO` stub left as-is, like `feud-board`). **Also build the ban/unban setter**
   (in scope, decided during grilling): an admin affordance on `admin/users` →
   registry form action writes `better_auth_user.banned` in D1 → write-through messages
   the live DO `{ban|unban: userId}` → the DO blocks/unblocks that user's submit/vote
   immediately. This is now a real, verifiable parity item, not illustrative.
6. **Decommission Jazz.** Remove `jazz-tools`, `PUBLIC_JAZZ_*` env, the provider in
   `+layout.svelte`, and fold `schema.ts` / `permissions.ts` logic into the D1 schema
   (Drizzle) + DO handlers.

## Resolved design decisions

These came out of a grilling session and are the parts the original sketch omitted.

- **WebSocket Hibernation API, day one.** Overlays are OBS sources holding sockets
  open for hours while mostly idle; the standard WS API would bill resident GB-s the
  whole show. Hibernation evicts the DO from memory while keeping sockets open. This
  bans in-DO `setInterval`/`setTimeout`, so the **Lower Third** auto-hide
  (`LOWER_THIRD_DISPLAY_MS`) is implemented with a single **Alarm**, not a timer. Room
  state lives in DO SQLite (survives hibernation/eviction → cheap correct reconnect
  snapshot); per-connection auth context goes in `serializeAttachment()`. See
  `docs/adr/0002-websocket-hibernation-and-alarm-auto-hide.md`.
- **Read model: the DO pre-shapes; clients read fields.** `QuerySubscription` is a
  query engine; the WS store is not. The DO sends each consumer exactly what it renders
  (e.g. the submissions overlay gets an already-approved, already-ordered,
  host-name-denormalized list). The client store exposes plain reactive room state;
  components read fields, no `.where()/.orderBy()` at call sites. Overlays carry zero
  app logic. **Per-consumer shaping must preserve today's read-visibility rules** — what
  Jazz permissions currently allow each viewer to _read_: approved submissions to viewers,
  the full set to admins (and the author's own pending submission, which the homepage
  relies on to show "your submission" state). The DO decides visibility per connection
  from its attached auth context; it does not send a viewer rows they couldn't read today.
- **Two write paths.** Room-state writes (ticker, approve, broadcast, feature, vote)
  are typed **WS messages to the DO handler**, authorized by the verified JWT. Registry
  writes (create show, assign host, edit host links, status→live, ban) become
  **SvelteKit form actions** with a server-side `is_admin` gate; `hooks.server.ts` does
  the auth plumbing (per-request `createAuth`, populate `event.locals`), the action
  does the write. This **inverts** the current CLAUDE.md "no endpoints for app data"
  rule — that rule existed only because Jazz let the client write safely.
- **Three connection classes to the per-show DO** (classified on connect from the
  optional JWT, stashed via `serializeAttachment()` so wakes don't re-verify):
  **anonymous** (overlays — no JWT, read-only, any write message rejected), **viewer**
  (valid non-admin JWT, `authMode: 'external'`, not banned — may send `submit`/`vote`
  for the live, open show; this is why viewers, not just admins, write over WS — their
  read socket is already open), and **admin** (valid `is_admin` JWT — full room writes).
  The homepage and overlays are both WS read clients of the live show's DO; only the
  homepage's authenticated socket may write. CSR-only (`ssr = false`) is unaffected:
  form-action endpoints still run server-side.
- **Directory DO for live-show discovery (announcer, not enforcer).** Overlays can't
  auto-follow the live show if they connect to one per-show DO. A singleton directory DO
  (fixed id) holds the current live show id and pushes changes so overlays reconnect to
  the new room (preserves today's zero-config auto-follow and the "always fresh" rule).
  It does **not** enforce **at most one show live** — that invariant is owned by **D1**,
  atomically, because liveness is a registry column and a database enforces a
  single-live-row rule in one constraint with no split-brain. The `status→live` form
  action performs one atomic D1 write that fails if another show is already live (partial
  unique index / single-row `live_show` table); only on success does it push the new live
  id to the directory DO to fan out. Demoting the directory DO to discovery removes the
  cross-store ordering problem entirely — there is no path where D1 and the DO disagree
  about which show is live. (Revised from an earlier sketch that made the directory DO
  the enforcer.)
- **DO↔D1 coherence: cold-start hydration + write-through.** The DO needs registry-origin
  facts that live in D1 — assigned show hosts and their display names, and the per-show
  ban status — but must not read D1 on the hot vote/submit/broadcast path. Two moments,
  neither hot: (1) **Hydration at room activation.** When the show goes `live` (the
  `status→live` form action, after the atomic D1 write), the DO pulls its registry-derived
  cache from D1 **once** into its own SQLite — assigned hosts + display names, current ban
  list. Without this the DO would render empty host names until someone edited. (2)
  **Write-through afterward.** A registry change while live writes D1 _and_ pushes the
  delta to the live DO, which mirrors it in SQLite: a host rename/reassignment, or a ban
  (`{ban|unban: userId}`) which the DO applies so the user's next submit/vote is
  blocked/allowed immediately. The hot path reads only the DO's local SQLite, never D1.
  Server-authoritative, realtime, no local-first machinery.

## Definition of done

This plan is meant to be handed to an agent and run to completion without a human in
the loop. "Done" is therefore objective and verifiable, not a judgement call. Run the
verification after every step; do not advance until the step's exit gate passes.

### Accepted disruptions (everything else is a regression)

Exactly two one-time costs are allowed; anything beyond them is a regression:

1. **Re-login.** Auth tables are created fresh in D1; every user signs in with GitHub
   again. Admin status re-derives from `ADMIN_GITHUB_USERNAMES` on sign-in.
2. **Re-create standing app data.** `shows`, `showHosts`, `hostLinks` start empty (no
   Jazz Cloud export). After cutover the operator re-creates any upcoming show and
   re-assigns its hosts once. Host _eligibility_ repopulates automatically — the `host`
   role is granted on admin sign-in.

No other user-visible behavior may change: same overlays, same operator flows, same
permissions.

### Verification methods (the agent must actually run these)

- After every step: `pnpm check`, `pnpm lint`, `pnpm build` — all green.
- Runtime: the iteration + verification loop is `vite dev` with `@cloudflare/vite-plugin`
  (real workerd, real local D1, real local DOs). Separately, `pnpm build` must emit the
  Cloudflare worker output and the app (console + overlays) must load under `wrangler dev`
  against that build (the final runtime-parity check).
- Auth for verification: the agent signs in through the **dev-auth bypass** (`DEV_AUTH=1`
  in `.dev.vars`) to get an **admin** session and, separately, a **viewer** session — no
  GitHub OAuth, no real credentials. This is what makes the behavior and reject-path gates
  automatable headlessly.
- Behavior: drive the running app with a headless browser. For realtime, open an
  overlay and the console (as admin) side by side and assert the overlay updates on an
  operator write with no reload.
- WebSocket correctness (prove on the ticker first): snapshot-on-connect, live patch on
  change, **a viewer (non-admin) socket's write rejected** (use the seeded viewer), and —
  close the socket / clear storage, reconnect — full re-sync from the DO snapshot.
- Auth claims: inspect the issued JWT for `{ id, name, email, image, githubUsername,
is_admin }`; the seeded admin gets `is_admin: true` (from its `roles`), the seeded
  viewer `false`. The real GitHub path and `ADMIN_GITHUB_USERNAMES` derivation are carried
  over unchanged but are not exercised headlessly.

### Per-step exit gates

1. **Provision.** `wrangler.jsonc` has D1 + DO bindings; `wrangler dev` boots with no
   binding errors; generated binding types compile.
2. **adapter-cloudflare + workerd via Vite plugin.** `svelte.config.js` uses
   `adapter-cloudflare`; `vite dev` runs on workerd via `@cloudflare/vite-plugin` with
   `event.platform.env` reachable in a server hook/load; `pnpm build` emits the worker and
   the app loads under `wrangler dev` against it. Server Sentry runs through
   `@sentry/cloudflare` and `instrumentation.server.ts` + the adapter-node
   tracing/instrumentation settings are gone. Jazz is still present and every feature
   still works unchanged at this point.
3. **Auth → D1.** `auth.ts` exports a per-request `createAuth(env)` factory (no
   module-level singleton, no `jazzAdapter` import); Better Auth tables exist in D1 via
   the Drizzle / `drizzle-orm/d1` adapter (`drizzle-orm` + `drizzle-kit` added,
   `drizzle.config.ts` present, migrations applied to local D1 via `wrangler d1 migrations
apply`); sign-in, sign-out, and JWT claims verify end to end **through the dev-auth
   bypass**, which exists and seeds an admin + a viewer. The `auth:schema` script
   regenerates the Drizzle schema; the `auth:validate` (`jazz-tools validate`) script is
   removed.
4. **Room primitive on the ticker.** A per-show DO on the Hibernation API (no
   `setInterval`/`setTimeout` in the DO) + the directory DO + the WS client store,
   passing all five verification checks. The directory rejects a second `status→live`.
   The ticker no longer imports Jazz.
5. **Remaining verticals.** Lower-thirds, submissions, votes, featured each pass their
   parity check below; each one's reads come off `QuerySubscription`, writes are split
   (registry → form action, room → DO message), permissions live in the DO handler /
   form action. ADR 0001's sentinel is deleted as part of lower-thirds. The ban/unban
   setter is built and verified: ban the seeded viewer mid-show → its next submit/vote is
   rejected with no reconnect; unban restores it.
6. **Decommission.** `grep -rn "jazz-tools" src` is empty; no `jazz*` entries in
   `package.json`; `PUBLIC_JAZZ_*` gone from `wrangler.jsonc` and env;
   `JazzSvelteProvider` removed from `+layout.svelte`; `schema.ts` / `permissions.ts`
   deleted or fully replaced by the D1 schema + DO handlers; `db:reset` repointed at
   local D1. All global gates green.

### Feature parity checklist (each behaves exactly as before)

- **Ticker:** admin adds/edits/deletes messages; ticker overlay shows current messages;
  updates are realtime; reconnect re-syncs.
- **Lower Third:** admin broadcasts a show host → overlay shows `displayName` +
  `lowerThirdTitle`; auto-hides after `LOWER_THIRD_DISPLAY_MS` via a DO **Alarm**; admin
  can hide sooner; "hidden" is the absence of an active host (sentinel retired).
- **Audience Submissions:** a logged-in, non-banned viewer can submit a `post`/`tool`
  only while the show is `live` and the submissions window is open; admin
  approves/rejects/deletes; approved submissions appear in the submissions overlay and
  the approved list. **Ban/unban is newly built** (admin affordance on `admin/users` →
  registry form action + write-through): a **mid-show ban takes effect immediately** and
  unban restores access — both with no reconnect.
- **Votes:** a logged-in, non-banned user votes on an `approved` submission that isn't
  their own; at most one vote per voter per submission; unvote removes it; counts update
  realtime.
- **Featured:** admin features an `approved` submission → the featured-submission
  overlay shows it; featuring requires `approved` status.
- **Console + public pages:** admin dashboard/shows/users, host prep pages, settings,
  and the **homepage** (the live viewer surface for submit/vote) render and mutate via
  their new path (registry from D1, room from the WS store) with no behavior change.
- **`show/[id]` and `feud-board`:** empty `TODO` stubs — out of scope; leave as-is. The
  viewer submit/vote surface that must reach parity is the homepage, not `show/[id]`.

## Risks

- **The reactive layer is the real cost.** Replacing `QuerySubscription` with a WS
  store touches every consuming component (~31 files import Jazz). The ~22 mutation
  sites and the ~93-line schema are mechanical by comparison.
- **Reconnection semantics.** OBS sources reconnect constantly; the
  snapshot-on-connect path must be cheap and correct. This is also the feature that
  fixes the current pain — get it right early (step 4).
- **Better Auth singleton trap.** A module-level `auth` silently breaks on Workers
  because the D1 binding is per-request. The factory refactor in step 3 is mandatory.
- **`nodejs_compat` verification.** Confirm Better Auth + the D1 adapter run clean on
  the Workers runtime during step 3.

## Scope

Roughly half the codebase's data layer. A real project, not a swap — but the sequence
keeps it shippable throughout.

## References

- Choosing a data or storage product — https://developers.cloudflare.com/workers/platform/storage-options/
- SQLite in Durable Objects — https://blog.cloudflare.com/sqlite-in-durable-objects/
- Node.js compatibility — https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- Better Auth without nodejs_compat (open) — https://github.com/better-auth/better-auth/issues/1375
