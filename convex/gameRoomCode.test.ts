/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * H5 — room-code backend for game rooms.
 *
 * Run with `npx vitest run convex/gameRoomCode.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

describe("H5 — createGameRoom / joinGameRoomByCode", () => {
  test("host creates a room and a second player joins by code", async () => {
    const t = convexTest(schema, modules);
    const host = t.withIdentity({ subject: "host" });
    const guest = t.withIdentity({ subject: "guest" });

    const created = await host.mutation(api.gameRoomCode.createGameRoom, {});
    if ("error" in created) throw new Error(created.error);
    expect(created.join_code).toHaveLength(6);

    const joined = await guest.mutation(api.gameRoomCode.joinGameRoomByCode, {
      join_code: created.join_code,
    });
    if ("error" in joined) throw new Error(joined.error);
    expect(joined.session_id).toBe(created.session_id);
    expect(joined.room_id).toBe(created.room_id);

    const players = await host.query(api.gameSessions.getSessionPlayers, {
      session_id: created.session_id,
    });
    expect(players.map((p) => p.user_id).sort()).toEqual(["guest", "host"]);
  });

  test("join_code is case-insensitive and tolerates surrounding whitespace", async () => {
    const t = convexTest(schema, modules);
    const host = t.withIdentity({ subject: "host2" });
    const guest = t.withIdentity({ subject: "guest2" });

    const created = await host.mutation(api.gameRoomCode.createGameRoom, {});
    if ("error" in created) throw new Error(created.error);

    const joined = await guest.mutation(api.gameRoomCode.joinGameRoomByCode, {
      join_code: `  ${created.join_code.toLowerCase()}  `,
    });
    if ("error" in joined) throw new Error(joined.error);
    expect(joined.session_id).toBe(created.session_id);
  });

  test("an unknown code is rejected", async () => {
    const t = convexTest(schema, modules);
    const guest = t.withIdentity({ subject: "guest3" });

    const joined = await guest.mutation(api.gameRoomCode.joinGameRoomByCode, {
      join_code: "ZZZZZZ",
    });
    expect(joined).toEqual({ error: "Invalid or expired room code" });
  });

  test("rejoining with the same code reconnects rather than double-seating", async () => {
    const t = convexTest(schema, modules);
    const host = t.withIdentity({ subject: "host4" });
    const guest = t.withIdentity({ subject: "guest4" });

    const created = await host.mutation(api.gameRoomCode.createGameRoom, {});
    if ("error" in created) throw new Error(created.error);

    const firstJoin = await guest.mutation(api.gameRoomCode.joinGameRoomByCode, {
      join_code: created.join_code,
    });
    if ("error" in firstJoin) throw new Error(firstJoin.error);
    expect(firstJoin.reconnected).toBe(false);

    const secondJoin = await guest.mutation(api.gameRoomCode.joinGameRoomByCode, {
      join_code: created.join_code,
    });
    if ("error" in secondJoin) throw new Error(secondJoin.error);
    expect(secondJoin.reconnected).toBe(true);

    const players = await host.query(api.gameSessions.getSessionPlayers, {
      session_id: created.session_id,
    });
    expect(players.filter((p) => p.user_id === "guest4")).toHaveLength(1);
  });

  test("a room locked by hitting capacity refuses new joiners by code", async () => {
    const t = convexTest(schema, modules);
    const host = t.withIdentity({ subject: "host5" });

    const created = await host.mutation(api.gameRoomCode.createGameRoom, {
      capacity: 2,
    });
    if ("error" in created) throw new Error(created.error);

    const secondSeat = await t
      .withIdentity({ subject: "guest5a" })
      .mutation(api.gameRoomCode.joinGameRoomByCode, { join_code: created.join_code });
    if ("error" in secondSeat) throw new Error(secondSeat.error);
    expect(secondSeat.locked).toBe(true);

    const thirdSeat = await t
      .withIdentity({ subject: "guest5b" })
      .mutation(api.gameRoomCode.joinGameRoomByCode, { join_code: created.join_code });
    expect(thirdSeat).toEqual({ error: "Session is no longer accepting new players" });
  });
});
