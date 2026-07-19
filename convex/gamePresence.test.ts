/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { HEARTBEAT_INTERVAL_MS, STALE_THRESHOLD_MS } from "./gamePresence";

/**
 * F1a — disconnect signal + the `gamePlayers.connected` write path.
 *
 * Same "real execution, not typecheck-only" bar D2c/D3/E2 established:
 * `convex-test` runs `heartbeat`/`goOffline`/`markStaleDisconnected`
 * against a simulated backend with its own real transaction lock and
 * scheduler, driven forward with `vi.useFakeTimers()` +
 * `vi.advanceTimersByTimeAsync` (the D3-established `tick()` pattern —
 * NOT `finishAllScheduledFunctions`, which D3's own notes recorded as
 * silently overshooting multiple intervals per call).
 *
 * Run with `npx vitest run convex/gamePresence.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

async function tick() {
  await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
}

/** Seats one fresh user via public matchmaking — simplest path to a real
 * `gamePlayers` row; F1a's mutations are mode-agnostic (they only look at
 * `gamePlayers`), so which mode seated the player doesn't matter here. */
async function seatOneUser(t: ReturnType<typeof convexTest>, subject: string) {
  const asUser = t.withIdentity({ subject });
  const result = await asUser.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
  if ("error" in result) throw new Error(`Seating error for ${subject}: ${result.error}`);
  return { asUser, sessionId: result.session_id };
}

describe("F1a — game presence heartbeat / disconnect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("heartbeat marks a player connected and refreshes their timestamp", async () => {
    const t = convexTest(schema, modules);
    const { asUser, sessionId } = await seatOneUser(t, "alice");

    const result = await asUser.mutation(api.gamePresence.heartbeat, { session_id: sessionId });
    expect(result).toEqual({ success: true });

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    const alice = players.find((p) => p.user_id === "alice");
    expect(alice?.connected).toBe(true);
    expect(alice?.last_heartbeat_at).toBeTypeOf("number");
  });

  test("heartbeat fails cleanly for a non-player", async () => {
    const t = convexTest(schema, modules);
    const { sessionId } = await seatOneUser(t, "alice");

    const stranger = t.withIdentity({ subject: "mallory" });
    const result = await stranger.mutation(api.gamePresence.heartbeat, { session_id: sessionId });
    expect(result).toEqual({ error: "Not a player in this session" });
  });

  test("a player who stops heartbeating gets flipped to connected: false by the sweep, while one who keeps heartbeating does not", async () => {
    const t = convexTest(schema, modules);
    const { asUser: alice, sessionId } = await seatOneUser(t, "alice");
    const bob = t.withIdentity({ subject: "bob" });
    const bobResult = await bob.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in bobResult) throw new Error(`bob seating error: ${bobResult.error}`);

    // Kick the sweep off (mirrors the client hook's on-mount heartbeat).
    await alice.mutation(api.gamePresence.heartbeat, { session_id: sessionId });
    await bob.mutation(api.gamePresence.heartbeat, { session_id: sessionId });

    // Advance well past STALE_THRESHOLD_MS, ticking one heartbeat interval
    // at a time (matching the sweep's own real re-scheduling cadence) —
    // bob keeps heartbeating on every tick, alice never heartbeats again.
    const ticksNeeded = Math.ceil(STALE_THRESHOLD_MS / HEARTBEAT_INTERVAL_MS) + 1;
    for (let i = 0; i < ticksNeeded; i++) {
      await tick();
      await bob.mutation(api.gamePresence.heartbeat, { session_id: sessionId });
    }

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    const aliceRow = players.find((p) => p.user_id === "alice");
    const bobRow = players.find((p) => p.user_id === "bob");
    expect(aliceRow?.connected).toBe(false);
    expect(bobRow?.connected).toBe(true);
  });

  test("goOffline flips connected: false instantly, without waiting for the sweep", async () => {
    const t = convexTest(schema, modules);
    const { asUser, sessionId } = await seatOneUser(t, "alice");
    await asUser.mutation(api.gamePresence.heartbeat, { session_id: sessionId });

    const result = await asUser.mutation(api.gamePresence.goOffline, { session_id: sessionId });
    expect(result).toEqual({ success: true });

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    const alice = players.find((p) => p.user_id === "alice");
    expect(alice?.connected).toBe(false);

    // The row itself must still exist — goOffline is not leaveSession.
    expect(alice).toBeDefined();
  });

  test("a stale player who heartbeats again reconnects (flips back to true)", async () => {
    const t = convexTest(schema, modules);
    const { asUser, sessionId } = await seatOneUser(t, "alice");
    await asUser.mutation(api.gamePresence.heartbeat, { session_id: sessionId });

    const ticksToGoStale = Math.ceil(STALE_THRESHOLD_MS / HEARTBEAT_INTERVAL_MS) + 1;
    for (let i = 0; i < ticksToGoStale; i++) {
      await tick();
    }

    const stalePlayers = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: sessionId,
    });
    expect(stalePlayers.find((p) => p.user_id === "alice")?.connected).toBe(false);

    // Reconnect: a fresh heartbeat is the reconnect signal (no separate
    // "reconnect" mutation in this file, per gamePresence.ts's own header).
    await asUser.mutation(api.gamePresence.heartbeat, { session_id: sessionId });

    const reconnectedPlayers = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: sessionId,
    });
    expect(reconnectedPlayers.find((p) => p.user_id === "alice")?.connected).toBe(true);
  });
});

describe("F1b — reconnect vs. stale-goOffline race guard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * The scenario F1a's own notes flagged as F1b's job: alice's old tab is
   * closing (its `beforeunload` has already fired, queuing a `goOffline`)
   * at the same moment a new tab reconnects her — modeled here as
   * `findOrCreatePublicSession`'s reconnect path (`seatPlayerInSession`),
   * since that's a real, already-wired client entry point for a reconnect,
   * per PublicLobbyEntry.tsx's own F1b update. The stale `goOffline` (still
   * carrying the OLD tab's connection id) must not undo the new tab's
   * reconnect.
   */
  test("a stale goOffline carrying an old connection id does not undo a newer reconnect", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "alice" });

    const oldTabId = "tab-old";
    const newTabId = "tab-new";

    // Old tab seats alice and starts heartbeating with its own id.
    const seatResult = await alice.mutation(api.publicMatchmaking.findOrCreatePublicSession, {
      connection_id: oldTabId,
    });
    if ("error" in seatResult) throw new Error(seatResult.error);
    const sessionId = seatResult.session_id;
    await alice.mutation(api.gamePresence.heartbeat, {
      session_id: sessionId,
      connection_id: oldTabId,
    });

    // New tab (a refresh) reconnects alice with a different id — this is
    // the "fresher connection" the old tab's in-flight goOffline hasn't
    // heard about yet.
    const reconnectResult = await alice.mutation(api.publicMatchmaking.findOrCreatePublicSession, {
      connection_id: newTabId,
    });
    if ("error" in reconnectResult) throw new Error(reconnectResult.error);
    expect(reconnectResult.reconnected).toBe(true);

    // The old tab's goOffline lands last, still carrying oldTabId.
    const goOfflineResult = await alice.mutation(api.gamePresence.goOffline, {
      session_id: sessionId,
      connection_id: oldTabId,
    });
    expect(goOfflineResult).toEqual({ success: true, skipped: true });

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    expect(players.find((p) => p.user_id === "alice")?.connected).toBe(true);
  });

  test("a genuine goOffline (matching connection id, no newer reconnect) still disconnects", async () => {
    const t = convexTest(schema, modules);
    const { asUser, sessionId } = await seatOneUser(t, "alice");
    const connectionId = "tab-only";
    await asUser.mutation(api.gamePresence.heartbeat, {
      session_id: sessionId,
      connection_id: connectionId,
    });

    const result = await asUser.mutation(api.gamePresence.goOffline, {
      session_id: sessionId,
      connection_id: connectionId,
    });
    expect(result).toEqual({ success: true });

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    expect(players.find((p) => p.user_id === "alice")?.connected).toBe(false);
  });

  test("goOffline with no connection id falls back to unconditional disconnect (back-compat)", async () => {
    const t = convexTest(schema, modules);
    const { asUser, sessionId } = await seatOneUser(t, "alice");
    // Alice's active_connection_id is set by a reconnect...
    await asUser.mutation(api.publicMatchmaking.findOrCreatePublicSession, {
      connection_id: "some-tab",
    });
    // ...but this goOffline caller doesn't know about connection ids at all.
    const result = await asUser.mutation(api.gamePresence.goOffline, { session_id: sessionId });
    expect(result).toEqual({ success: true });

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    expect(players.find((p) => p.user_id === "alice")?.connected).toBe(false);
  });
});
