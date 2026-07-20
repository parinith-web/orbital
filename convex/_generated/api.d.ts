/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as calls from "../calls.js";
import type * as chatNotifications from "../chatNotifications.js";
import type * as crons from "../crons.js";
import type * as gamePresence from "../gamePresence.js";
import type * as gameRoomCode from "../gameRoomCode.js";
import type * as gameRounds from "../gameRounds.js";
import type * as gameSessions from "../gameSessions.js";
import type * as lib_conversations from "../lib/conversations.js";
import type * as messages from "../messages.js";
import type * as presence from "../presence.js";
import type * as publicMatchmaking from "../publicMatchmaking.js";
import type * as reactions from "../reactions.js";
import type * as roomQueries from "../roomQueries.js";
import type * as rooms from "../rooms.js";
import type * as storage from "../storage.js";
import type * as typing from "../typing.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  calls: typeof calls;
  chatNotifications: typeof chatNotifications;
  crons: typeof crons;
  gamePresence: typeof gamePresence;
  gameRoomCode: typeof gameRoomCode;
  gameRounds: typeof gameRounds;
  gameSessions: typeof gameSessions;
  "lib/conversations": typeof lib_conversations;
  messages: typeof messages;
  presence: typeof presence;
  publicMatchmaking: typeof publicMatchmaking;
  reactions: typeof reactions;
  roomQueries: typeof roomQueries;
  rooms: typeof rooms;
  storage: typeof storage;
  typing: typeof typing;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
