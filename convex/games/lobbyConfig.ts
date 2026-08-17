/**
 * E2 — public-lobby autostart countdown duration. Split into its own pure
 * (no Convex imports) module, same reasoning as `turnOrder.ts`'s
 * `DEFAULT_TURN_DURATION_MS`: `gameRounds.ts` imports Convex's
 * `mutation`/`internalMutation` wrappers and generated server code, which
 * client components can't safely pull into a browser bundle just to read
 * one constant. This file has none of that, so `RoundView`-style client
 * countdown UI can import straight from here.
 *
 * orbital_1.md's locked-in default: "4 players triggers a 15s countdown."
 */
export const AUTOSTART_COUNTDOWN_MS = 15 * 1000;

/**
 * G2 — the prefix `generateSessionId("public_room")` (gameSessions.ts) uses
 * for a public session's synthetic `room_id`. Split out here, same pure-
 * module reasoning as `AUTOSTART_COUNTDOWN_MS` above, so client code that
 * needs to tell "this is a real Orbital room" from "this is a public Anomaly
 * lobby's synthetic room" apart (see PersistentCallWidget.tsx) has one
 * canonical string to check against instead of a second hardcoded copy of
 * `publicMatchmaking.ts`'s own literal. This is the `prefix` argument
 * `generateSessionId(prefix)` (gameSessions.ts) is called with — the id it
 * actually mints is `${prefix}_${...}`, so a caller checking "is this a
 * public-lobby room_id" should test `startsWith(PUBLIC_LOBBY_ROOM_ID_PREFIX + "_")`,
 * not a bare `startsWith(PUBLIC_LOBBY_ROOM_ID_PREFIX)`.
 */
export const PUBLIC_LOBBY_ROOM_ID_PREFIX = "public_room";

/**
 * H2 — the game-ending score threshold. The moment any player's cumulative
 * `gamePlayers.score` reaches this value right after a reveal, the session
 * ends (`performReveal` in gameRounds.ts flips `status` to `"ended"` and the
 * existing `status === "ended"` guards on `startRound`/`autoStartRound`
 * already stop any further round from starting — no separate "stop
 * autostart" flag needed). Applies to both private and public sessions
 * alike: a room's own players compete against that same fixed target, not
 * against each other's "should we keep going" judgment call. The
 * leaderboard shown on end (H3) ranks only that session's own participants
 * by this same `score` field, so the threshold and the ranking are always
 * reading the same number.
 *
 * Split into its own pure (no Convex imports) module for the same reason as
 * `AUTOSTART_COUNTDOWN_MS` above — client countdown/progress UI (e.g. a
 * "7/10" score readout) can import this constant directly without pulling
 * in Convex's generated server code.
 */
export const WINNING_SCORE = 10;

/**
 * H5 — shareable join-code format for `gameRoomCode.ts`'s `createGameRoom` /
 * `joinGameRoomByCode`. Split out here for the same pure-module reason as
 * the constants above — a "join code" input field in the H6/H7 UI can
 * import `JOIN_CODE_LENGTH` for a maxLength/placeholder without pulling in
 * Convex server code.
 *
 * ALPHABET excludes visually-ambiguous characters (0/O, 1/I/L) since these
 * codes are meant to be read off one screen and typed into another —
 * unlike `generateSessionId`'s ids (never shown to a user), this one is.
 * 6 characters over a 32-symbol alphabet is ~30 bits of entropy, which is
 * plenty for a code that's only ever compared against *currently live*
 * sessions (see `joinGameRoomByCode`'s "ended sessions never collide"
 * note) rather than needing to stay globally unique forever.
 */
export const JOIN_CODE_LENGTH = 6;
export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
