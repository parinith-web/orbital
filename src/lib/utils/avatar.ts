import { isAvatarConfigCode } from "@/lib/avatar/options";

const DEFAULT_AVATAR = "/assets/defaultAvatar.png";

/**
 * Resolves a stored `avatar` value to something usable as a plain <img>/
 * <Image> `src`. A user's `avatar` field now normally holds an avatar-maker
 * config code (e.g. "h07-ef-ms-c2E6FF2"), which can't be rendered this way —
 * it needs <UserAvatar/> (see @/components/avatar) to decode and draw the
 * SVG. Call sites still on this helper fall back to the default image for
 * config-code avatars until they're migrated to <UserAvatar/>; real
 * uploaded-image URLs (legacy accounts) keep working as before.
 */
export function getAvatarUrl(
  avatar: string | undefined | null,
  fallback?: string,
): string {
  if (avatar && !isAvatarConfigCode(avatar)) return avatar;
  return fallback || DEFAULT_AVATAR;
}

export function getSenderAvatar(
  messageSenderId: string,
  currentUserId: string | undefined,
  messageSender: { avatar?: string | null } | null | undefined,
  currentUser: { avatar?: string | null } | undefined,
): string | undefined {
  const isCurrentUser = messageSenderId === currentUserId;
  // Always prefer the "live" profile but fallback to the message's cached sender data
  const avatar = isCurrentUser
    ? currentUser?.avatar || messageSender?.avatar
    : messageSender?.avatar;

  // Returned as-is (not run through getAvatarUrl) so callers can hand it
  // straight to <UserAvatar/>, which handles both avatar-maker config
  // codes and legacy uploaded-image URLs itself.
  return avatar || undefined;
}

export function getDisplayName(
  messageSenderId: string,
  currentUserId: string | undefined,
  messageSender: { username?: string | null } | null | undefined,
): string {
  return messageSender?.username || "Unknown";
}
