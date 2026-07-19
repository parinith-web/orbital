/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * G1 — event logging for the PRD's §8 Success Metrics.
 *
 * Same bar this feature's other backend tests have set since D2c/F1f: real
 * execution via `convex-test` against every mutation this session actually
 * instrumented, not a typecheck-only pass. `gameEvents` has no client-facing
 * query of its own (deliberately — see gameEvents.ts's own header, this is
 * a raw log, not an analytics API), so every assertion here reads the table
 * directly via `t.run`, same pattern `publicMatchmakingDedup.test.ts` already
 * uses for direct db access in tests.
 *
 * Run with `npx vitest run convex/gameEvents.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

const AUTOSTART_COUNTDOWN_MS = 15 * 1000; // must match gameRounds.ts's exported AUTOSTART_COUNTDOWN_MS

async function allEvents(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => await ctx.db.query("gameEvents").collect());
}

describe("G1 — event logging", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  test("createSession logs a private session_created event, once, on genuine creation only", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ subject: "owner_1" });

    await t.run(async (ctx) => {
      await ctx.db.insert("rooms", { room_id: "room_1", room_name: "Test Room", is_group: true });
      await ctx.db.insert("roomMembers", {
        room_id: "room_1",
        user_id: "owner_1",
        role: "owner",
        username: "Owner",
      });
    });

    const created = await owner.mutation(api.gameSessions.createSession, { room_id: "room_1" });
    if ("error" in created) throw new Error(`Unexpected error: ${created.error}`);

    // Double-click / idempotent re-entry must NOT log a second event.
    const again = await owner.mutation(api.gameSessions.createSession, { room_id: "room_1" });
    if ("error" in again) throw new Error(`Unexpected error: ${again.error}`);
    expect(again.alreadyExists).toBe(true);

    const events = await allEvents(t);
    const sessionCreatedEvents = events.filter((e) => e.event_type === "session_created");
    expect(sessionCreatedEvents).toHaveLength(1);
    expect(sessionCreatedEvents[0].mode).toBe("private");
    expect(sessionCreatedEvents[0].room_id).toBe("room_1");
    expect(sessionCreatedEvents[0].session_id).toBe(created.session_id);
    expect(sessionCreatedEvents[0].user_id).toBe("owner_1");
  });

  test("a brand-new public room logs both session_created (public) and public_join_requested", async () => {
    const t = convexTest(schema, modules);
    const first = t.withIdentity({ subject: "first_public_player" });

    const result = await first.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in result) throw new Error(`Unexpected error: ${result.error}`);
    expect(result.created).toBe(true);

    const events = await allEvents(t);
    const sessionCreated = events.filter((e) => e.event_type === "session_created" && e.mode === "public");
    expect(sessionCreated).toHaveLength(1);
    expect(sessionCreated[0].session_id).toBe(result.session_id);

    const joinRequested = events.filter((e) => e.event_type === "public_join_requested");
    expect(joinRequested).toHaveLength(1);
    expect(joinRequested[0].session_id).toBe(result.session_id);
    expect(joinRequested[0].user_id).toBe("first_public_player");
    expect(JSON.parse(joinRequested[0].metadata ?? "{}")).toEqual({ reconnected: false });
  });

  test("joining an existing waiting public room logs one public_join_requested, no second session_created", async () => {
    const t = convexTest(schema, modules);
    const first = t.withIdentity({ subject: "player_a" });
    const second = t.withIdentity({ subject: "player_b" });

    const firstResult = await first.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in firstResult) throw new Error(`Unexpected error: ${firstResult.error}`);
    const secondResult = await second.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in secondResult) throw new Error(`Unexpected error: ${secondResult.error}`);
    expect(secondResult.session_id).toBe(firstResult.session_id);
    expect(secondResult.created).toBe(false);

    const events = await allEvents(t);
    expect(events.filter((e) => e.event_type === "session_created")).toHaveLength(1);
    const joinRequested = events.filter((e) => e.event_type === "public_join_requested");
    expect(joinRequested).toHaveLength(2);
    expect(new Set(joinRequested.map((e) => e.user_id))).toEqual(new Set(["player_a", "player_b"]));
  });

  test("a refresh mid-match (reconnect branch) logs public_join_requested with reconnected: true", async () => {
    const t = convexTest(schema, modules);
    const player = t.withIdentity({ subject: "refresher" });

    const first = await player.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in first) throw new Error(`Unexpected error: ${first.error}`);

    const second = await player.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in second) throw new Error(`Unexpected error: ${second.error}`);
    expect(second.session_id).toBe(first.session_id);

    const events = await allEvents(t);
    const joinRequested = events.filter((e) => e.event_type === "public_join_requested");
    expect(joinRequested).toHaveLength(2);
    const reconnectEvent = joinRequested.find(
      (e) => JSON.parse(e.metadata ?? "{}").reconnected === true,
    );
    expect(reconnectEvent).toBeDefined();
  });

  test("beginRound logs round_started for both manual and autostart triggers", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("rooms", { room_id: "room_2", room_name: "Manual Room", is_group: true });
      for (const id of ["m1", "m2", "m3"]) {
        await ctx.db.insert("roomMembers", { room_id: "room_2", user_id: id, role: "member", username: id });
      }
    });
    const starter = t.withIdentity({ subject: "m1" });
    const created = await starter.mutation(api.gameSessions.createSession, { room_id: "room_2" });
    if ("error" in created) throw new Error(`Unexpected error: ${created.error}`);

    const started = await starter.mutation(api.gameRounds.startRound, { session_id: created.session_id });
    if (!started || "error" in started) {
      throw new Error(`Unexpected error starting round: ${started && "error" in started ? started.error : "?"}`);
    }

    const manualEvents = (await allEvents(t)).filter((e) => e.event_type === "round_started");
    expect(manualEvents).toHaveLength(1);
    expect(manualEvents[0].mode).toBe("private");
    expect(manualEvents[0].round_number).toBe(1);
    expect(manualEvents[0].user_id).toBe("m1");
    expect(JSON.parse(manualEvents[0].metadata ?? "{}")).toEqual({ trigger: "manual" });

    // Autostart path: fill a public room to its 4-player autostart
    // threshold and let the scheduled countdown job fire the round itself
    // (no authenticated caller involved).
    for (const id of ["p1", "p2", "p3", "p4"]) {
      const asPlayer = t.withIdentity({ subject: id });
      const joined = await asPlayer.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
      if ("error" in joined) throw new Error(`Unexpected error: ${joined.error}`);
    }

    await vi.advanceTimersByTimeAsync(AUTOSTART_COUNTDOWN_MS);

    const events = await allEvents(t);
    const autostartEvents = events.filter(
      (e) => e.event_type === "round_started" && e.mode === "public",
    );
    expect(autostartEvents).toHaveLength(1);
    expect(autostartEvents[0].round_number).toBe(1);
    expect(autostartEvents[0].user_id).toBeUndefined();
    expect(JSON.parse(autostartEvents[0].metadata ?? "{}")).toEqual({ trigger: "autostart" });
  });

  test("leaveSession logs player_left_public_session for public mode only, with rounds-played context", async () => {
    const t = convexTest(schema, modules);

    // Public leave, before any round has started — round_number should be 0.
    const publicPlayer = t.withIdentity({ subject: "public_leaver" });
    const publicJoin = await publicPlayer.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in publicJoin) throw new Error(`Unexpected error: ${publicJoin.error}`);
    await publicPlayer.mutation(api.gameSessions.leaveSession, { session_id: publicJoin.session_id });

    const afterPublicLeave = (await allEvents(t)).filter(
      (e) => e.event_type === "player_left_public_session",
    );
    expect(afterPublicLeave).toHaveLength(1);
    expect(afterPublicLeave[0].mode).toBe("public");
    expect(afterPublicLeave[0].user_id).toBe("public_leaver");
    expect(afterPublicLeave[0].round_number).toBe(0);

    // Private leave should NOT log this event at all — private sessions
    // aren't in scope for this metric (see gameSessions.ts's own comment).
    await t.run(async (ctx) => {
      await ctx.db.insert("rooms", { room_id: "room_3", room_name: "Private Room", is_group: true });
      for (const id of ["priv_a", "priv_b", "priv_c"]) {
        await ctx.db.insert("roomMembers", { room_id: "room_3", user_id: id, role: "member", username: id });
      }
    });
    const privUser = t.withIdentity({ subject: "priv_a" });
    const privSession = await privUser.mutation(api.gameSessions.createSession, { room_id: "room_3" });
    if ("error" in privSession) throw new Error(`Unexpected error: ${privSession.error}`);
    await privUser.mutation(api.gameSessions.leaveSession, { session_id: privSession.session_id });

    const stillOnlyOne = (await allEvents(t)).filter(
      (e) => e.event_type === "player_left_public_session",
    );
    expect(stillOnlyOne).toHaveLength(1); // unchanged — private leave logged nothing
  });
});
