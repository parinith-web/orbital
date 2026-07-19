/**
 * E2 — public-lobby autostart countdown duration. Split into its own pure
 * (no Convex imports) module, same reasoning as `turnOrder.ts`'s
 * `DEFAULT_TURN_DURATION_MS`: `gameRounds.ts` imports Convex's
 * `mutation`/`internalMutation` wrappers and generated server code, which
 * client components can't safely pull into a browser bundle just to read
 * one constant. This file has none of that, so `RoundView`-style client
 * countdown UI can import straight from here.
 *
 * portal_1.md's locked-in default: "4 players triggers a 15s countdown."
 */
export const AUTOSTART_COUNTDOWN_MS = 15 * 1000;

/**
 * G2 — the prefix `generateSessionId("public_room")` (gameSessions.ts) uses
 * for a public session's synthetic `room_id`. Split out here, same pure-
 * module reasoning as `AUTOSTART_COUNTDOWN_MS` above, so client code that
 * needs to tell "this is a real Portal room" from "this is a public Signal
 * lobby's synthetic room" apart (see PersistentCallWidget.tsx) has one
 * canonical string to check against instead of a second hardcoded copy of
 * `publicMatchmaking.ts`'s own literal. This is the `prefix` argument
 * `generateSessionId(prefix)` (gameSessions.ts) is called with — the id it
 * actually mints is `${prefix}_${...}`, so a caller checking "is this a
 * public-lobby room_id" should test `startsWith(PUBLIC_LOBBY_ROOM_ID_PREFIX + "_")`,
 * not a bare `startsWith(PUBLIC_LOBBY_ROOM_ID_PREFIX)`.
 */
export const PUBLIC_LOBBY_ROOM_ID_PREFIX = "public_room";
