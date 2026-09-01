import { decodeAvatarConfig, isAvatarConfigCode } from "@/lib/avatar/options";
import { AvatarSVG } from "./AvatarSVG";

const DEFAULT_AVATAR = "/assets/defaultAvatar.png";

interface UserAvatarProps {
  /** The stored `avatar` value — an avatar-maker config code for anyone who
   * has customized their avatar, a legacy uploaded-image URL for older
   * accounts that haven't touched it yet, or undefined/null before a user
   * has anything set. */
  avatar?: string | null;
  size?: number;
  className?: string;
  /** Shown to screen readers; defaults to a generic label since most call
   * sites already have a username nearby. */
  alt?: string;
}

/**
 * The one component every profile-pic-shaped spot in the app should render
 * through, so an avatar looks identical in the maker, a room card, chat, a
 * DM thread, etc. Decodes and draws the avatar-maker SVG when `avatar` is a
 * config code; falls back to a plain image for legacy uploaded avatars or
 * the bundled default when there's nothing saved yet.
 */
export function UserAvatar({ avatar, size = 40, className, alt = "Avatar" }: UserAvatarProps) {
  if (avatar && isAvatarConfigCode(avatar)) {
    const config = decodeAvatarConfig(avatar);
    return (
      <div
        className={className}
        style={{ backgroundColor: `${config.color}22` }}
      >
        <AvatarSVG config={config} size={size} className="w-full h-full" />
      </div>
    );
  }

  // Plain <img>, matching the pre-existing pattern this component
  // replaces: used across many small/dynamic avatar slots where
  // next/image's fixed-size contract and remote-pattern config aren't
  // worth it.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar || DEFAULT_AVATAR}
      alt={alt}
      width={size}
      height={size}
      className={className}
    />
  );
}

export default UserAvatar;
