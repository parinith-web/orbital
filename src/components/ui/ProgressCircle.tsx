"use client";

interface ProgressCircleProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressCircle({
  progress,
  size = 40,
  strokeWidth = 3,
  color = "currentColor",
}: ProgressCircleProps) {
  const cornerRadius = size * 0.3;
  const side = size - strokeWidth;
  const x = strokeWidth / 2;
  const y = strokeWidth / 2;
  const w = side;
  const h = side;
  const r = cornerRadius;

  // Start at the top-left curve for a clean corner start
  const d = `M ${x},${y + r} A ${r},${r} 0 0 1 ${x + r},${y} L ${x + w - r},${y} A ${r},${r} 0 0 1 ${x + w},${y + r} L ${x + w},${y + h - r} A ${r},${r} 0 0 1 ${x + w - r},${y + h} L ${x + r},${y + h} A ${r},${r} 0 0 1 ${x},${y + h - r} L ${x},${y + r} Z`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Square */}
        <path
          d={d}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Square */}
        <path
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray="100"
          pathLength="100"
          style={{
            strokeDashoffset: 100 - progress,
            transition: "stroke-dashoffset 0.1s ease-out",
          }}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
