# A dev-only auth bypass so the migration can be verified without a human

The Jazz→Cloudflare migration (`docs/jazz-to-cloudflare-migration.md`) is meant to be
handed to an agent and run to completion with no human in the loop. Every verification
gate in that plan's Definition of Done — JWT claims, admin room-state writes, the
non-admin rejection path, end-to-end behavior parity — requires an **authenticated**
session. The only sign-in path is interactive GitHub OAuth: an external consent screen
plus real credentials that an autonomous agent cannot drive headlessly. The plan also
needs two distinct identities at once — an **Admin** and a non-admin viewer — to prove
that a non-admin socket's write is rejected.

So GitHub OAuth, by itself, makes the "no human in the loop" goal impossible. The
alternatives considered were: pre-seeded session fixtures (needs a human once, breaks on
token expiry, must seed two identities by hand), mocking the JWT only at the Durable
Object boundary (covers the WS reject path but leaves the browser behavior gates
unautomatable), and simply accepting a human for the auth gates (abandons the goal).

## Decision

Add a **dev-only auth bypass**: a sign-in path that skips GitHub and establishes a
session for one of two seeded users — a seeded **Admin** and a seeded viewer.

Two guardrails make this safe to live in the codebase:

- **Gated on an explicit env var, not the framework `dev` flag.** The bypass activates
  only when `DEV_AUTH=1`, a variable that lives solely in local `.dev.vars` and is set in
  no deployed environment. SvelteKit's `import { dev } from '$app/environment'` is
  deliberately _not_ used as the gate, because it is `false` under `wrangler dev`
  (workerd runs a production build) — which is exactly the runtime the agent verifies
  against, so a `dev`-flag gate would be both unreliable and inconsistent between
  `vite dev` and `wrangler dev`. With the var absent, the bypass route does not exist
  (404 / throw); the hook asserts its absence on the production path.
- **It issues a real JWT through the existing pipeline.** The dev sign-in upserts the two
  seeded users into D1 with explicit `roles` and then mints a session and JWT via Better
  Auth's existing JWT/JWKS plugin and `definePayload`. It does not hand-craft a token.
  This means the JWKS signature verification and `claims.is_admin` derivation that the
  Durable Object relies on are exercised for real, not stubbed.

## Consequences

- The agent can flip between an admin and a viewer session headlessly and drive every
  DoD gate, including the non-admin reject path.
- A non-GitHub route capable of minting an admin session now exists in the tree. Its
  safety rests entirely on the env-var gate. Anyone who loosens that gate — or wires the
  bypass to the `dev` flag, or sets `DEV_AUTH` in a deployed env — reintroduces an auth
  bypass in production. Do not.
- The seeded users are test identities, not real GitHub accounts; their `roles` are set
  directly by the bypass rather than derived from `ADMIN_GITHUB_USERNAMES`.
