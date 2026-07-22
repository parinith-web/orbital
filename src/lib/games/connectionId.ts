/**
 * F1b — a single, stable id for "this browser tab's" Anomaly connection.
 *
 * WHY THIS EXISTS: F1a's `goOffline` (fired from `beforeunload`/`pagehide`)
 * and F1a's `heartbeat` (fired on mount + on an interval) both write
 * `gamePlayers.connected` for the same user, and a refresh/reconnect can
 * put a *stale* `goOffline` from the closing old tab in flight at the same
 * moment the *new* tab's first heartbeat (or a reconnect via
 * `seatPlayerInSession`) is establishing `connected: true` again. Convex
 * serializes the two writes (no corruption either way), but whichever
 * lands last wins, and "the old tab's goOffline lands last" is a real
 * ordering the client can't prevent. This id lets the server tell the two
 * apart: `heartbeat`/`seatPlayerInSession`'s reconnect branch stamp
 * whichever connection id called them as `gamePlayers.active_connection_id`,
 * and `goOffline` only actually disconnects if the id it's carrying still
 * matches — i.e. no newer connection has taken over since. See
 * `convex/gamePresence.ts`'s header for the server side of this.
 *
 * SCOPED TO THE TAB, NOT THE SESSION: generated once per page load (module
 * singleton) rather than per Anomaly session, so every mutation this tab
 * ever makes for any session it touches — `heartbeat`, `goOffline`,
 * `joinSession`, `findOrCreatePublicSession` — carries the same id. That's
 * what makes "a newer connection took over" a meaningful check: a genuine
 * reconnect from a *different* tab (different id) supersedes; heartbeat
 * calls from *this same* tab re-confirming its own id are just routine
 * refreshes, not new connections, and lose no ground.
 *
 * `crypto.randomUUID()` needs a secure context (https, or localhost) —
 * true for every deployed/dev Portal target. No fallback is provided; if
 * this throws, F1b's guard simply doesn't engage for that tab, which is a
 * strict improvement over not existing (falls back to F1a's pre-existing
 * unconditional-disconnect behavior — see the optional-arg handling in
 * `gamePresence.ts`/`gameSessions.ts`), not a regression.
 */
let cachedConnectionId: string | null = null;

export function getTabConnectionId(): string {
  if (cachedConnectionId) return cachedConnectionId;
  cachedConnectionId = crypto.randomUUID();
  return cachedConnectionId;
}
