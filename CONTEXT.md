# Pole

Live-show production tooling: a show-runner app plus OBS browser-source overlays that read the same Jazz database.

## Language

**Show**:
A scheduled or in-progress broadcast. Has a status of `draft`, `live`, or `ended`. Transitions between statuses are unrestricted — an admin can move a show in any direction (e.g. `ended → live` to recover from a misclick). **At most one show may be `live` at any time.**
_Avoid_: Episode, stream, event.

**Audience Submissions Window**:
A per-show admin toggle (`audienceSubmissionsOpen`) that controls whether viewers can post new **Audience Submissions**. Independent of show status — submissions can be closed mid-live for pacing.
_Avoid_: Submission state, intake mode.

**Admin**:
A user with full write access to app data. Identity is determined by GitHub login matching `ADMIN_GITHUB_USERNAMES`; the JWT carries `claims.is_admin` and Jazz permissions key off that claim.
_Avoid_: Owner, operator.

**Host**:
A user *eligible* to be assigned as on-air talent for a show. Encoded as `'host'` in `better_auth_user.roles`. Today every **Admin** is automatically a **Host**; the role is kept separate so non-admin hosts can be introduced later without a schema change. Eligibility ≠ assignment — assignment is a **Show Host**.
_Avoid_: Presenter, talent.

**Show Host**:
A row in the `showHosts` table that assigns a specific **Host** to a specific **Show** with an on-air display name. A **Host** becomes a **Show Host** only by explicit assignment; the role alone does not place anyone on a show.
_Avoid_: Co-host, panelist.

**Audience Submission**:
A link (post or tool) submitted by a viewer during a live show, pending admin approval before it can appear in overlays.
_Avoid_: Suggestion, contribution.

**Vote**:
A viewer's endorsement of an **Audience Submission**, modeled as the *existence* of a `submissionVotes` row. There is no vote value or weight — the row is the vote. Unvoting is row deletion. Planned but not wired in the UI yet.
_Avoid_: Like, upvote, score.

**Feature** (verb / `isFeatured` flag):
Admin curation that lifts an **Audience Submission** into the on-air overlay. Distinct from a **Vote**: featuring is editorial, voting is audience signal.
_Avoid_: Highlight, pin.

**Ban** (verb / `banned` flag on the user):
An **Admin** action that bars a viewer from creating **Audience Submissions** or casting **Votes**. A banned viewer can still read; only their writes are refused. Banning takes effect immediately, including mid-live. The bar is per-user and global (not per-show). Eligibility to be banned is just being any viewer; the **Admin** is the only role that can ban or unban.
_Avoid_: Block, mute, kick.

**Overlay**:
A transparent, 1920×1080 browser route designed to be loaded as an OBS browser source. Reads Jazz data the same way the app does — no separate data path.
_Avoid_: Scene, widget.

**Lower Third**:
The on-screen graphic identifying who is currently speaking, anchored in the lower third of the broadcast frame. Pole renders at most one **Show Host** in the **Lower Third** at a time, controlled by `shows.activeLowerThirdShowHostId`.
_Avoid_: Name strap, chyron, bug.

**Broadcast** (verb):
The act of pushing a **Show Host** to the **Lower Third** overlay by setting `shows.activeLowerThirdShowHostId` to that host's id. Broadcasting a second host overwrites the first. Each broadcast auto-hides after `LOWER_THIRD_DISPLAY_MS` (currently 10s) unless an admin hides it sooner; the hide path writes the sentinel `HIDDEN_LOWER_THIRD_SHOW_HOST_ID` rather than `null` (see `docs/adr/0001-lower-third-sentinel-uuid.md`).
_Avoid_: Show, push, send.

## Relationships

- A **Show** has zero or more **Show Hosts**; each **Show Host** references one **Host**.
- Today, every **Admin** is also a **Host** (the role is granted on sign-in). A **Host** is not automatically a **Show Host** of any **Show**.
- An **Audience Submission** belongs to one **Show** and one viewer (any logged-in, non-banned user).
- An **Overlay** is a read-only view of one **Show**'s state.

## Flagged ambiguities

- "host" was overloaded across (1) the `host` role on `better_auth_user`, (2) the `showHosts` table, and (3) the `/host/` route group. Resolved: **Host** = the role/eligibility, **Show Host** = the per-show assignment row. The `/host/` route serves the prep UI for users who are eligible (i.e. carry the role).
- A prior **Vote** design stored a `value` field on each row. Resolved: votes are now set-membership only — no `value` column. Do not reintroduce one.
- **Overlay data path — planned change, do not apply until built.** The **Overlay** entry above ("reads Jazz data the same way the app does — no separate data path") describes the current Jazz architecture. The planned Cloudflare migration (`docs/jazz-to-cloudflare-migration.md`) makes overlays read-only WebSocket clients of a per-show Durable Object — a *separate* path from how the console reads durable data. When it lands, this glossary needs a new distinction the team is already using: **Registry** (durable, cross-show data: shows list, hosts, host links, auth — lives in D1) vs **Room State** (one live show's ephemeral state: ticker, lower-third, submissions, votes, featured — lives in that show's Durable Object). At that point rewrite the **Overlay** entry and retire the **Broadcast** entry's sentinel-UUID clause (the sentinel from `docs/adr/0001` only existed to work around Jazz's null-propagation; the DO clears reliably).
