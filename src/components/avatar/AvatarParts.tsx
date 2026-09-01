import type { EyeStyle, HatStyle, MouthStyle } from "@/lib/avatar/options";

/**
 * Raw SVG part renderers, all sharing one 220x220 coordinate space so any
 * combination of hat/eyes/mouth lines up regardless of which ones are
 * picked. Kept as plain functions (not components) — they're assembled in
 * a fixed order inside AvatarSVG and never used standalone, so component
 * overhead isn't worth it.
 *
 * Every shape was prototyped and rendered at scale before porting here
 * (see the SVG grid used to check for overlap/legibility across all 15
 * hats x 3 eyes x 3 mouths) — the coordinates below are final, not
 * placeholder guesses.
 */

export const STROKE = "#0b0b10";
const SW = 9;

export function HeadPart({ fill }: { fill: string }) {
  return (
    <circle cx={110} cy={128} r={78} fill={fill} stroke={STROKE} strokeWidth={SW} />
  );
}

export function EyesPart({ direction }: { direction: EyeStyle }) {
  const dx = direction === "right" ? 6 : direction === "left" ? -6 : 0;
  return (
    <>
      {[82, 138].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={120} r={19} fill="white" stroke={STROKE} strokeWidth={6} />
          <circle cx={cx + dx} cy={122} r={8.5} fill={STROKE} />
          <circle cx={cx + dx + 3} cy={119} r={2.4} fill="white" />
        </g>
      ))}
    </>
  );
}

export function MouthPart({ style }: { style: MouthStyle }) {
  if (style === "grin") {
    return (
      <>
        <path
          d="M76,160 Q110,200 144,160 Q110,206 76,160 Z"
          fill="white"
          stroke={STROKE}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <path
          d="M84,168 Q110,178 136,168"
          fill="none"
          stroke={STROKE}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path d="M98,188 Q110,196 122,188 Q110,192 98,188 Z" fill="#FF6B7A" />
      </>
    );
  }
  if (style === "smirk") {
    return (
      <path
        d="M80,160 Q106,172 124,164 Q132,160 140,146"
        fill="none"
        stroke={STROKE}
        strokeWidth={6}
        strokeLinecap="round"
      />
    );
  }
  // smile
  return (
    <path
      d="M85,165 Q110,182 135,165"
      fill="none"
      stroke={STROKE}
      strokeWidth={6}
      strokeLinecap="round"
    />
  );
}

export function HatPart({ style, accent = "white" }: { style: HatStyle; accent?: string }) {
  const S = STROKE;
  switch (style) {
    case "peak":
      return (
        <path
          d="M110,8 L138,62 L110,80 L82,62 Z"
          fill="white"
          stroke={S}
          strokeWidth={8}
          strokeLinejoin="round"
        />
      );
    case "horns":
      return (
        <>
          <path d="M78,60 L64,18 L92,48 Z" fill="white" stroke={S} strokeWidth={7} strokeLinejoin="round" />
          <path d="M142,60 L156,18 L128,48 Z" fill="white" stroke={S} strokeWidth={7} strokeLinejoin="round" />
        </>
      );
    case "flame":
      return (
        <path
          d="M110,10 C128,26 128,46 116,58 C122,44 108,40 106,52 C98,44 100,28 110,10 Z"
          fill={accent}
          stroke={S}
          strokeWidth={7}
          strokeLinejoin="round"
        />
      );
    case "gem":
      return (
        <path
          d="M110,10 L136,44 L110,66 L84,44 Z"
          fill={accent}
          stroke={S}
          strokeWidth={7}
          strokeLinejoin="round"
        />
      );
    case "antennae":
      return (
        <>
          <line x1={86} y1={55} x2={80} y2={20} stroke={S} strokeWidth={6} strokeLinecap="round" />
          <circle cx={79} cy={15} r={8} fill={accent} stroke={S} strokeWidth={6} />
          <line x1={134} y1={55} x2={140} y2={20} stroke={S} strokeWidth={6} strokeLinecap="round" />
          <circle cx={141} cy={15} r={8} fill={accent} stroke={S} strokeWidth={6} />
        </>
      );
    case "spike":
      return (
        <path d="M70,62 L60,20 L92,50 Z" fill={accent} stroke={S} strokeWidth={7} strokeLinejoin="round" />
      );
    case "hook":
      return (
        <path
          d="M104,58 C100,30 118,14 138,22"
          fill="none"
          stroke={S}
          strokeWidth={9}
          strokeLinecap="round"
        />
      );
    case "crown":
      return (
        <path
          d="M74,58 L82,20 L98,42 L110,14 L122,42 L138,20 L146,58 Z"
          fill={accent}
          stroke={S}
          strokeWidth={6}
          strokeLinejoin="round"
        />
      );
    case "leaf":
      return (
        <path
          d="M108,58 C92,50 88,26 112,12 C120,30 122,48 108,58 Z"
          fill={accent}
          stroke={S}
          strokeWidth={7}
          strokeLinejoin="round"
        />
      );
    case "ballstalk":
      return (
        <>
          <line x1={110} y1={55} x2={110} y2={22} stroke={S} strokeWidth={6} strokeLinecap="round" />
          <circle cx={110} cy={14} r={10} fill={accent} stroke={S} strokeWidth={6} />
        </>
      );
    case "catears":
      return (
        <>
          <path d="M68,55 L62,14 L96,42 Z" fill={accent} stroke={S} strokeWidth={7} strokeLinejoin="round" />
          <path d="M152,55 L158,14 L124,42 Z" fill={accent} stroke={S} strokeWidth={7} strokeLinejoin="round" />
        </>
      );
    case "twinpeaks":
      return (
        <>
          <path d="M92,58 L82,16 L104,46 Z" fill="white" stroke={S} strokeWidth={7} strokeLinejoin="round" />
          <path d="M128,58 L138,16 L116,46 Z" fill="white" stroke={S} strokeWidth={7} strokeLinejoin="round" />
        </>
      );
    case "poms":
      return (
        <>
          <line x1={92} y1={55} x2={86} y2={24} stroke={S} strokeWidth={6} strokeLinecap="round" />
          <circle cx={85} cy={17} r={9} fill={accent} stroke={S} strokeWidth={6} />
          <line x1={128} y1={55} x2={134} y2={24} stroke={S} strokeWidth={6} strokeLinecap="round" />
          <circle cx={135} cy={17} r={9} fill={accent} stroke={S} strokeWidth={6} />
        </>
      );
    case "stalkdot":
      return (
        <>
          <line x1={110} y1={55} x2={110} y2={30} stroke={S} strokeWidth={6} strokeLinecap="round" />
          <circle cx={110} cy={22} r={6} fill={accent} stroke={S} strokeWidth={5} />
        </>
      );
    case "nub":
      return <circle cx={110} cy={42} r={14} fill={accent} stroke={S} strokeWidth={7} />;
    default:
      return null;
  }
}
