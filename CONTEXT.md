# Pole

Live-show production tooling: a show-runner app plus OBS browser-source overlays. Durable, cross-show data (the **Registry**) lives in D1; one live show's ephemeral **Room State** lives in a per-show Durable Object that overlays and the homepage read over WebSockets.

## Language

**Show**:
A scheduled or in-progress broadcast. Has a status of `draft`, `live`, or `ended`. Transitions between statuses are unrestricted — an admin can move a show in any direction (e.g. `ended → live` to recover from a misclick). **At most one show may be `live` at any time.**
_Avoid_: Episode, stream, event.

**Audience Submissions Window**:
A per-show admin toggle (the DO's `submissionsOpen` **Room State**) that controls whether viewers can post new **Audience Submissions**. Independent of show status — submissions can be closed mid-live for pacing.
_Avoid_: Submission state, intake mode.

**Admin**:
A user with full write access to app data. Identity is determined by GitHub login matching `ADMIN_GITHUB_USERNAMES`; the JWT carries `claims.is_admin`. Registry writes gate on it in SvelteKit form actions; room writes gate on it in the Durable Object (which verifies the JWT against the live JWKS).
_Avoid_: Owner, operator.

**Host**:
A user _eligible_ to be assigned as on-air talent for a show. Encoded as `'host'` in `better_auth_user.roles`. Today every **Admin** is automatically a **Host**; the role is kept separate so non-admin hosts can be introduced later without a schema change. Eligibility ≠ assignment — assignment is a **Show Host**.
_Avoid_: Presenter, talent.

**Show Host**:
A row in the `showHosts` table that assigns a specific **Host** to a specific **Show** with an on-air display name. A **Host** becomes a **Show Host** only by explicit assignment; the role alone does not place anyone on a show.
_Avoid_: Co-host, panelist.

**Audience Submission**:
A link (post or tool) submitted by a viewer during a live show, pending admin approval before it can appear in overlays.
_Avoid_: Suggestion, contribution.

**Vote**:
A viewer's endorsement of an **Audience Submission**, modeled as set membership — the _existence_ of a `(submissionId, voterId)` pair in the show's **Room State**. There is no vote value or weight. Unvoting removes the pair. A viewer may not vote on their own submission, and at most once per submission; counts update in realtime.
_Avoid_: Like, upvote, score.

**Feature** (verb / `isFeatured` flag):
Admin curation that lifts an **Audience Submission** into the on-air overlay. Distinct from a **Vote**: featuring is editorial, voting is audience signal.
_Avoid_: Highlight, pin.

**Ban** (verb / `banned` flag on the user):
An **Admin** action that bars a viewer from creating **Audience Submissions** or casting **Votes**. A banned viewer can still read; only their writes are refused. Banning takes effect immediately, including mid-live. The bar is per-user and global (not per-show). Eligibility to be banned is just being any viewer; the **Admin** is the only role that can ban or unban.
_Avoid_: Block, mute, kick.

**Overlay**:
A transparent, 1920×1080 browser route designed to be loaded as an OBS browser source. A stateless, read-only WebSocket client of the live show's per-show Durable Object: it discovers the live show via the singleton **Directory** DO, connects, receives a snapshot, and applies pushed changes. No local database — if OBS clears storage or recreates the source, the overlay reconnects and re-syncs from the DO snapshot.
_Avoid_: Scene, widget.

**Registry**:
Durable, cross-show data that lives in D1: the auth tables, the shows list and metadata (including `status`, which D1 enforces single-`live` on atomically), **Show Host** assignments, and host links. Read-heavy and queried across shows. Registry writes are SvelteKit form actions with a server-side **Admin** gate.
_Avoid_: Database (ambiguous), store.

**Room State**:
One live show's ephemeral state, owned by that show's per-show Durable Object (its own SQLite): ticker messages, the active **Lower Third**, the **Audience Submissions Window** gate, **Audience Submissions**, **Votes**, and the **Featured** selection. Hot and realtime; fanned out over WebSockets. Room writes are typed messages to the DO, authorized by the verified JWT.
_Avoid_: Session, cache.

**Lower Third**:
The on-screen graphic identifying who is currently speaking, anchored in the lower third of the broadcast frame. Pole renders at most one **Show Host** in the **Lower Third** at a time. The active host is **Room State** (held in the show's Durable Object), not a registry column.
_Avoid_: Name strap, chyron, bug.

**Broadcast** (verb):
The act of pushing a **Show Host** to the **Lower Third** overlay — a room message that sets the show DO's active lower-third host and fans it out. Broadcasting a second host overwrites the first. Each broadcast auto-hides after `LOWER_THIRD_DISPLAY_MS` (10s) via a single DO **Alarm** (no in-DO timers) unless an admin hides it sooner. The DO clears the active host reliably, so the `docs/adr/0001` sentinel UUID is retired.
_Avoid_: Show, push, send.

## Relationships

- A **Show** has zero or more **Show Hosts**; each **Show Host** references one **Host**.
- Today, every **Admin** is also a **Host** (the role is granted on sign-in). A **Host** is not automatically a **Show Host** of any **Show**.
- An **Audience Submission** belongs to one **Show** and one viewer (any logged-in, non-banned user).
- An **Overlay** is a read-only WebSocket view of the live **Show**'s **Room State**.

## Flagged ambiguities

- "host" was overloaded across (1) the `host` role on `better_auth_user`, (2) the `showHosts` table, and (3) the `/host/` route group. Resolved: **Host** = the role/eligibility, **Show Host** = the per-show assignment row. The `/host/` route serves the prep UI for users who are eligible (i.e. carry the role).
- A prior **Vote** design stored a `value` field on each row. Resolved: votes are now set-membership only — no `value` column. Do not reintroduce one.
- **Overlay data path — resolved (Cloudflare migration landed).** Jazz is gone. Overlays are now read-only WebSocket clients of a per-show Durable Object; the **Overlay**, **Registry**, and **Room State** entries above reflect this, and the **Broadcast** sentinel-UUID clause is retired (`docs/adr/0001` is superseded). See `docs/jazz-to-cloudflare-migration.md`.
