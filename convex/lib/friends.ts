// Session 5 — shared helpers for the Friends feature's canonical-pair
// convention (set up structurally by Session 4's schema comments, made
// concrete here). Both friends.ts and messages.ts's direct-message guard
// import from here so the "how do we order/name a pair" decision lives in
// exactly one place.

/**
 * Sorts two user ids into the canonical (user_id_a, user_id_b) order used
 * as the row key for both the `friends` and `conversations` tables —
 * lexicographically smaller first, so a given pair of users always maps to
 * exactly one row regardless of who's "me" and who's "them" in a caller's
 * hands.
 */
export function canonicalPair(
  userIdX: string,
  userIdY: string,
): [string, string] {
  return userIdX < userIdY ? [userIdX, userIdY] : [userIdY, userIdX];
}

const DIRECT_CONVERSATION_PREFIX = "direct";

/**
 * Deterministic `messages.conversation_id` for a friend DM thread, derived
 * from the canonical pair so both sides always land on the same thread
 * without needing to look anything up first (e.g. before the first message
 * is ever sent). Not a Convex id — just a stable string, same role as a
 * room's `room_id` plays for room messages.
 */
export function directConversationId(userIdX: string, userIdY: string): string {
  const [a, b] = canonicalPair(userIdX, userIdY);
  return `${DIRECT_CONVERSATION_PREFIX}:${a}:${b}`;
}

/**
 * Inverse of directConversationId: recovers the canonical pair from a
 * direct conversation_id. Returns null if the string isn't one of ours
 * (wrong prefix, tampered with, etc.) — callers should treat that as "not
 * a valid direct conversation" rather than guessing.
 */
export function parseDirectConversationId(
  conversationId: string,
): [string, string] | null {
  const parts = conversationId.split(":");
  if (parts.length !== 3 || parts[0] !== DIRECT_CONVERSATION_PREFIX) {
    return null;
  }
  const [, userIdA, userIdB] = parts;
  if (!userIdA || !userIdB) return null;
  return [userIdA, userIdB];
}
