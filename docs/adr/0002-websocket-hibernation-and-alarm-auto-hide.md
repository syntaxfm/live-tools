# Use the WebSocket Hibernation API for show DOs, with Alarm-based lower-third auto-hide

The per-show Durable Object fans out live state to overlays over WebSockets. Overlays
are OBS browser sources that hold a socket open for the entire length of a show —
hours — while being almost entirely idle (the ticker and lower-third change
occasionally, not continuously).

With the standard WebSocket API (`addEventListener`), the DO stays resident in memory
for as long as any socket is open, accruing Billable Duration (GB-s) for the whole
show even when nothing is happening. Cloudflare explicitly recommends the **Hibernation
API** for exactly this shape: the DO evicts from memory while keeping sockets open and
wakes only when a message actually flows, so idle time is not billed. For "a few
overlays connected for three hours, changing every few minutes," this is the difference
between paying for three hours of resident compute and paying for near-zero.

We adopt the Hibernation API from the first DO we build, rather than starting on the
standard API and optimising later, because the choice is structural and expensive to
retrofit:

- **No in-DO `setInterval`/`setTimeout`.** Scheduled callbacks prevent hibernation and
  keep the DO billable. This directly constrains the **Lower Third** auto-hide
  (`LOWER_THIRD_DISPLAY_MS`, currently 10s): instead of a timer holding the DO awake,
  the broadcast handler sets a single **Alarm** ~10s out. The DO hibernates, wakes once
  when the alarm fires, writes the hide, and hibernates again. A future reader who finds
  an Alarm doing a 10-second auto-hide should understand it is *because* of hibernation,
  not by accident.
- **Room state lives in DO SQLite, not instance memory.** It must survive hibernation
  and eviction. This is also what makes the snapshot-on-reconnect path cheap and
  correct — the snapshot is read straight from SQLite — which is the feature that fixes
  the original OBS local-store failure.
- **Per-connection auth context uses `serializeAttachment()`.** Whether a socket is an
  admin, and which show it belongs to, is attached to the connection so the DO does not
  re-verify the JWT on every wake.

The trade-off accepted: the standard `addEventListener` API is marginally simpler to
write first, and we give that up. Retrofitting hibernation later would mean rewriting
the DO's connection model and its timer logic after every vertical is already built on
the simpler one — strictly more work than starting correct.
