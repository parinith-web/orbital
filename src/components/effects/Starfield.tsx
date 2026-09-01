"use client";

import { useEffect, useRef } from "react";

interface StarfieldProps {
  /** Base RGB color of the stars, 0-255 each channel */
  starColor?: [number, number, number];
  /** Roughly how many stars per 10,000px^2 of canvas area */
  density?: number;
  /** Overall drift speed in px/sec */
  speed?: number;
  /** Direction stars drift in, in degrees (0 = right, 90 = down) */
  direction?: number;
  /** Radius (px) around the cursor that pushes stars away */
  mouseRadius?: number;
  /** How strongly stars get pushed away from the cursor */
  repelStrength?: number;
  /** How quickly displaced stars ease back onto their path (0-1, higher = snappier) */
  returnEase?: number;
  /** Whether stars twinkle in brightness */
  twinkle?: boolean;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  offsetX: number;
  offsetY: number;
}

export default function Starfield({
  starColor = [255, 255, 255],
  density = 1.1,
  speed = 12,
  direction = 35,
  mouseRadius = 110,
  repelStrength = 90,
  returnEase = 0.06,
  twinkle = true,
  className,
}: StarfieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const angleRad = (direction * Math.PI) / 180;
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const makeStar = (w: number, h: number, seedAnywhere: boolean): Star => {
      const size = rand(0.6, 1.9);
      const speedJitter = rand(0.5, 1.3);
      return {
        x: seedAnywhere ? rand(0, w) : rand(0, w),
        y: seedAnywhere ? rand(0, h) : rand(0, h),
        vx: dirX * speed * speedJitter,
        vy: dirY * speed * speedJitter,
        size,
        baseAlpha: rand(0.35, 1),
        twinklePhase: rand(0, Math.PI * 2),
        twinkleSpeed: rand(0.6, 1.8),
        offsetX: 0,
        offsetY: 0,
      };
    };

    const populate = (w: number, h: number) => {
      const area = w * h;
      const count = Math.max(24, Math.round((area / 10000) * density));
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) stars.push(makeStar(w, h, true));
      starsRef.current = stars;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      populate(w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };
    const handlePointerLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    let lastTime = performance.now();
    const [r, g, b] = starColor;

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const { w, h } = sizeRef.current;

      ctx.clearRect(0, 0, w, h);

      const mouse = mouseRef.current;
      const stars = starsRef.current;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // drift along the base path
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        // wrap around edges with a small buffer so stars re-enter smoothly
        const buffer = 20;
        if (s.x < -buffer) s.x = w + buffer;
        if (s.x > w + buffer) s.x = -buffer;
        if (s.y < -buffer) s.y = h + buffer;
        if (s.y > h + buffer) s.y = -buffer;

        const drawX = s.x + s.offsetX;
        const drawY = s.y + s.offsetY;

        // push away from cursor, forming a clear path
        if (mouse.active) {
          const dx = drawX - mouse.x;
          const dy = drawY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius && dist > 0.0001) {
            const falloff = 1 - dist / mouseRadius;
            const push = falloff * falloff * repelStrength;
            s.offsetX += (dx / dist) * push * dt * 4;
            s.offsetY += (dy / dist) * push * dt * 4;
          }
        }

        // ease displaced stars back onto their path
        s.offsetX += (0 - s.offsetX) * returnEase;
        s.offsetY += (0 - s.offsetY) * returnEase;

        // twinkle
        let alpha = s.baseAlpha;
        if (twinkle) {
          s.twinklePhase += s.twinkleSpeed * dt;
          alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(s.twinklePhase));
        }
        alpha = Math.max(0, Math.min(1, alpha));

        const fx = s.x + s.offsetX;
        const fy = s.y + s.offsetY;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.arc(fx, fy, s.size, 0, Math.PI * 2);
        ctx.fill();

        // subtle glow on slightly larger stars
        if (s.size > 1.3) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.12})`;
          ctx.arc(fx, fy, s.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starColor.join(","), density, speed, direction, mouseRadius, repelStrength, returnEase, twinkle]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
