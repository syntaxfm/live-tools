# Use a sentinel UUID for "lower-third hidden" instead of null

`shows.activeLowerThirdShowHostId` is an optional ref to `showHosts`, so the natural
encoding of "no host is currently in the lower-third overlay" is `null`. In practice,
clearing the field to `null` did not propagate reliably for the live broadcast/clear
path in Jazz, so the runtime clear path sets the field to the sentinel UUID
`00000000-0000-4000-8000-000000000001` instead. That id will never resolve to a real
`showHosts` row, so the overlay's `include({ activeLowerThirdShowHost: true })` returns
`null` and the lower-third renders nothing — the desired behavior. The constant lives
in `src/lib/utils/lower-thirds.ts` as `HIDDEN_LOWER_THIRD_SHOW_HOST_ID`.

The cascading `deleteShow` path still writes `null` directly, because that write
happens once immediately before the row is deleted and does not need to survive as
live state.

If a future Jazz release fixes the null-ref live-update behavior, this can be
reverted by replacing the sentinel with `null` everywhere and migrating existing
rows that hold the sentinel.
