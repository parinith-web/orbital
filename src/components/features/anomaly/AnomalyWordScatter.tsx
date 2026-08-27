/**
 * Ambient background for the Anomaly landing page — a scatter of
 * game-themed words in mixed fonts and sizes, a few of them circled by
 * hand in the accent color, standing in for the dot-grid pattern this
 * used to be. Same idea as the marker-circled "ANOMALY" cover art on the
 * Game Hub tile: a word getting singled out from the rest is the game's
 * whole premise, so the background gets to do that too instead of being
 * pure texture.
 *
 * Positions/rotations/fonts are hand-placed, not `Math.random()` at
 * render time — this is a client component either way, but fixed values
 * mean the layout doesn't reshuffle on every re-render and there's no
 * hydration-mismatch risk if it's ever rendered server-side later.
 *
 * Pure decoration: `pointer-events-none`, sits behind the real content,
 * and never claims a straight `aria-hidden` `alt`/label since it carries
 * no information.
 */
type ScatterWord = {
  word: string;
  top: string;
  left: string;
  rotate: number;
  size: string;
  font: "font-sans" | "font-pop" | "font-mono" | "font-serif";
  opacity: number;
  circled?: boolean;
};

const WORDS: ScatterWord[] = [
  { word: "IMPOSTER", top: "6%", left: "8%", rotate: -8, size: "text-3xl", font: "font-pop", opacity: 0.1 },
  { word: "SUSPECT", top: "22%", left: "4%", rotate: 4, size: "text-2xl", font: "font-mono", opacity: 0.09 },
  { word: "DECEIVE", top: "30%", left: "86%", rotate: -10, size: "text-2xl", font: "font-pop", opacity: 0.1, circled: true },
  { word: "whisper", top: "52%", left: "82%", rotate: 8, size: "text-lg", font: "font-serif", opacity: 0.11 },
  { word: "MIMIC", top: "58%", left: "6%", rotate: -6, size: "text-2xl", font: "font-mono", opacity: 0.1, circled: true },
  { word: "VOTE", top: "70%", left: "72%", rotate: -4, size: "text-3xl", font: "font-pop", opacity: 0.1 },
  { word: "SECRET WORD", top: "10%", left: "60%", rotate: 2, size: "text-lg", font: "font-mono", opacity: 0.1, circled: true },
  { word: "outlier", top: "90%", left: "8%", rotate: 5, size: "text-xl", font: "font-serif", opacity: 0.09 },
  { word: "GLITCH", top: "48%", left: "94%", rotate: -9, size: "text-lg", font: "font-pop", opacity: 0.08 },
];

/** A loose, slightly imperfect hand-drawn loop — never a clean ellipse,
 * so it reads as marker-drawn rather than a UI badge. */
export function HandCircle({ rotate }: { rotate: number }) {
  return (
    <svg
      viewBox="0 0 140 70"
      className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)]"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <path
        d="M 22 38
           C 14 20, 34 6, 68 5
           C 104 4, 130 16, 128 35
           C 126 54, 100 66, 66 65
           C 32 64, 12 52, 18 36"
        fill="none"
        stroke="var(--theme-accent-color)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AnomalyWordScatter() {
  return (
    <div className="absolute inset-0 overflow-hidden select-none" aria-hidden>
      {WORDS.map((w, i) => (
        <span
          key={i}
          className={`absolute whitespace-nowrap font-semibold tracking-tight ${w.size} ${w.font}`}
          style={{
            top: w.top,
            left: w.left,
            transform: `rotate(${w.rotate}deg)`,
            color: w.circled ? "var(--theme-accent-color)" : "white",
            opacity: w.circled ? Math.min(w.opacity + 0.12, 1) : w.opacity,
          }}
        >
          {w.circled && <HandCircle rotate={-w.rotate * 0.6} />}
          <span className="relative">{w.word}</span>
        </span>
      ))}
    </div>
  );
}
