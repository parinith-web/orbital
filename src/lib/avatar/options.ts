/**
 * Single source of truth for the avatar-maker option sets. Everything here
 * is plain data (no rendering), so it can be imported both by the maker UI
 * and, later, by wherever an <AvatarSVG /> gets rendered as a profile pic
 * without dragging in the picker UI.
 *
 * The four axes match what was asked for: 3 eye styles, 3 mouth styles,
 * 15 hats, 15 colors — 2,025 possible combinations from one small asset
 * set, all drawn as flat SVG so they render crisply at any size and can be
 * recolored without shipping a raster image per combination.
 */

export type EyeStyle = "forward" | "right" | "left";
export type MouthStyle = "smile" | "grin" | "smirk";
export type HatStyle =
  | "peak"
  | "horns"
  | "flame"
  | "gem"
  | "antennae"
  | "spike"
  | "hook"
  | "crown"
  | "leaf"
  | "ballstalk"
  | "catears"
  | "twinpeaks"
  | "poms"
  | "stalkdot"
  | "nub";

export interface AvatarConfig {
  color: string;
  eyes: EyeStyle;
  mouth: MouthStyle;
  hat: HatStyle;
}

export const EYE_OPTIONS: { id: EyeStyle; label: string }[] = [
  { id: "forward", label: "Forward" },
  { id: "right", label: "Side-glance" },
  { id: "left", label: "Sly" },
];

export const MOUTH_OPTIONS: { id: MouthStyle; label: string }[] = [
  { id: "smile", label: "Smile" },
  { id: "grin", label: "Grin" },
  { id: "smirk", label: "Smirk" },
];

export const HAT_OPTIONS: { id: HatStyle; label: string }[] = [
  { id: "peak", label: "Peak" },
  { id: "horns", label: "Horns" },
  { id: "flame", label: "Flame" },
  { id: "gem", label: "Gem" },
  { id: "antennae", label: "Antennae" },
  { id: "spike", label: "Spike" },
  { id: "hook", label: "Curl" },
  { id: "crown", label: "Crown" },
  { id: "leaf", label: "Leaf" },
  { id: "ballstalk", label: "Antenna Ball" },
  { id: "catears", label: "Cat Ears" },
  { id: "twinpeaks", label: "Twin Peaks" },
  { id: "poms", label: "Pom Poms" },
  { id: "stalkdot", label: "Dot Antenna" },
  { id: "nub", label: "Nub" },
];

// Same 15 hexes already used for the landing-page avatar showcase, so a
// user's made avatar always lines up with a color they've seen on the
// marketing site.
export const COLOR_OPTIONS: { id: string; label: string }[] = [
  { id: "#2E6FF2", label: "Blue" },
  { id: "#FFD23F", label: "Yellow" },
  { id: "#FF3D8A", label: "Pink" },
  { id: "#38D66B", label: "Green" },
  { id: "#B073FF", label: "Purple" },
  { id: "#FF8C42", label: "Orange" },
  { id: "#22D3EE", label: "Cyan" },
  { id: "#FF4136", label: "Red" },
  { id: "#14B8A6", label: "Teal" },
  { id: "#FFB703", label: "Amber" },
  { id: "#E930C6", label: "Magenta" },
  { id: "#1447E6", label: "Cobalt" },
  { id: "#F5A623", label: "Marigold" },
  { id: "#7C8798", label: "Slate" },
  { id: "#FF7A6B", label: "Coral" },
];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  color: COLOR_OPTIONS[0].id,
  eyes: "forward",
  mouth: "smile",
  hat: "peak",
};

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export function randomAvatarConfig(): AvatarConfig {
  return {
    color: pick(COLOR_OPTIONS).id,
    eyes: pick(EYE_OPTIONS).id,
    mouth: pick(MOUTH_OPTIONS).id,
    hat: pick(HAT_OPTIONS).id,
  };
}

/**
 * Compact, URL/DB-friendly encoding, e.g. "h07-eforward-msmile-c2E6FF2".
 * Deliberately human-readable (not a bitpacked int) since the option sets
 * are small and this is far easier to debug or hand-edit than a hash.
 */
export function encodeAvatarConfig(config: AvatarConfig): string {
  const hatIndex = HAT_OPTIONS.findIndex((h) => h.id === config.hat);
  const eyeCode = config.eyes[0]; // f | r | l
  const mouthCode = config.mouth[0]; // s | g | m(irk, "sm" clashes with smile so use full below)
  return [
    `h${String(hatIndex).padStart(2, "0")}`,
    `e${eyeCode}`,
    `m${config.mouth === "smirk" ? "k" : mouthCode}`,
    `c${config.color.replace("#", "")}`,
  ].join("-");
}

// Matches encodeAvatarConfig's output exactly, e.g. "h07-eforward-msmile-c2E6FF2"
// wouldn't match (that's the old verbose shape) — the real shape is
// "h07-ef-ms-c2E6FF2". Used to tell an avatar-maker code apart from a
// legacy uploaded-image URL/path stored in the same `avatar` field, so
// callers can decide whether to decode-and-render an <AvatarSVG/> or just
// use the value as an <img> src.
const AVATAR_CONFIG_CODE_PATTERN = /^h\d{2}-e[frl]-m[sgk]-c[0-9a-fA-F]{6}$/;

export function isAvatarConfigCode(value: string | undefined | null): boolean {
  if (!value) return false;
  return AVATAR_CONFIG_CODE_PATTERN.test(value);
}

export function decodeAvatarConfig(code: string): AvatarConfig {
  const parts = Object.fromEntries(
    code.split("-").map((part) => [part[0], part.slice(1)]),
  );

  const hat = HAT_OPTIONS[Number(parts.h)]?.id ?? DEFAULT_AVATAR_CONFIG.hat;
  const eyes: EyeStyle =
    parts.e === "r" ? "right" : parts.e === "l" ? "left" : "forward";
  const mouth: MouthStyle =
    parts.m === "g" ? "grin" : parts.m === "k" ? "smirk" : "smile";
  const color = parts.c ? `#${parts.c}` : DEFAULT_AVATAR_CONFIG.color;

  return { hat, eyes, mouth, color };
}
