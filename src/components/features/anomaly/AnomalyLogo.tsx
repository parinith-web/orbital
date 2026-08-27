/**
 * Anomaly's logomark — "spot the odd one out", rendered literally: a 3x3
 * field of identical dots with one standing out as a glowing diamond. It's
 * a direct visual pun on the game itself (find the imposter hiding among
 * identical-looking players) rather than a generic controller/joystick
 * glyph, so it reads as *this* game's mark at a glance, not "a game".
 *
 * Pure SVG (no external asset) so it inherits the user's chosen accent
 * color via `currentColor` / `--theme-accent-color` the same way the rest
 * of the app's theme-aware surfaces do, and stays crisp at both the small
 * Game Hub tile size and the large landing-page hero size.
 */
type AnomalyLogoProps = {
  className?: string;
  /** Adds a soft pulsing glow behind the anomalous node — nice at hero
   * size, too busy at icon size, so it's opt-in. */
  glow?: boolean;
};

export function AnomalyLogo({ className = "w-6 h-6", glow = false }: AnomalyLogoProps) {
  // 3x3 grid, evenly spaced; the anomalous node sits center-right (index 5)
  // so it doesn't look like a bullseye-centered logo — a real "odd one
  // out" is never dead center.
  const positions = [8, 20, 32].flatMap((y) => [8, 20, 32].map((x) => ({ x, y })));
  const anomalyIndex = 5;

  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Anomaly logo"
    >
      <rect width="40" height="40" rx="10" fill="var(--theme-accent-color)" fillOpacity="0.14" />

      {glow && (
        <circle
          cx={positions[anomalyIndex].x}
          cy={positions[anomalyIndex].y}
          r="9"
          fill="var(--theme-accent-color)"
          opacity="0.55"
          className="animate-fade-slow"
        />
      )}

      {positions.map((p, i) =>
        i === anomalyIndex ? (
          <rect
            key={i}
            x={p.x - 3.6}
            y={p.y - 3.6}
            width="7.2"
            height="7.2"
            rx="1.6"
            transform={`rotate(45 ${p.x} ${p.y})`}
            fill="var(--theme-accent-color)"
          />
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r="2.6" fill="white" fillOpacity="0.55" />
        ),
      )}
    </svg>
  );
}
