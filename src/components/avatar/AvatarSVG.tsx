import type { AvatarConfig } from "@/lib/avatar/options";
import { EyesPart, HatPart, HeadPart, MouthPart } from "./AvatarParts";

interface AvatarSVGProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  /** Optional DOM id — set this when a caller needs to grab the live SVG
   * element directly (e.g. to serialize it for a download), rather than
   * rendering a second hidden copy just to get an id. */
  id?: string;
}

/**
 * Renders one avatar from a config object. Pure and presentational —
 * doesn't know about the picker UI, storage, or profile pics. Meant to be
 * the one component both the avatar maker's preview AND (eventually)
 * anywhere a profile pic shows today can share, so an avatar looks
 * identical in the maker, on a room card, in chat, etc.
 */
export function AvatarSVG({ config, size = 96, className, id }: AvatarSVGProps) {
  return (
    <svg
      id={id}
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Avatar"
    >
      <HatPart style={config.hat} />
      <HeadPart fill={config.color} />
      <EyesPart direction={config.eyes} />
      <MouthPart style={config.mouth} />
    </svg>
  );
}

export default AvatarSVG;
