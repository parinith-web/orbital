const DEFAULT_AVATAR = "/assets/defaultAvatar.png";

export function getAvatarUrl(
  avatar: string | undefined | null,
  fallback?: string,
): string {
  if (avatar) return avatar;
  return fallback || DEFAULT_AVATAR;
}

export function getSenderAvatar(
  messageSenderId: string,
  currentUserId: string | undefined,
  messageSender: { avatar?: string | null } | null | undefined,
  currentUser: { avatar?: string | null } | undefined,
): string {
  const isCurrentUser = messageSenderId === currentUserId;
  // Always prefer the "live" profile but fallback to the message's cached sender data
  const avatar = isCurrentUser
    ? currentUser?.avatar || messageSender?.avatar
    : messageSender?.avatar;

  return getAvatarUrl(avatar);
}

export function getDisplayName(
  messageSenderId: string,
  currentUserId: string | undefined,
  messageSender: { username?: string | null } | null | undefined,
): string {
  return messageSender?.username || "Unknown";
}
