"use client";

import { useEffect, useRef, useState } from "react";

interface ColorWheelPickerProps {
  color: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s: s * 100, v: v * 100 };
}

function hsvToHex(h: number, s: number, v: number): string {
  const sat = s / 100;
  const val = v / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function ColorWheelPicker({ color, onChange, onClose }: ColorWheelPickerProps) {
  const initial = hexToHsv(color);
  const [hue, setHue] = useState(initial.h);
  const [sat, setSat] = useState(initial.s);
  const [val, setVal] = useState(initial.v);

  const squareRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const draggingSquare = useRef(false);
  const draggingHue = useRef(false);

  // Redraw the saturation/value square whenever hue changes.
  useEffect(() => {
    const canvas = squareRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, w, h);

    const whiteGrad = ctx.createLinearGradient(0, 0, w, 0);
    whiteGrad.addColorStop(0, "rgba(255,255,255,1)");
    whiteGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, w, h);

    const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0, "rgba(0,0,0,0)");
    blackGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, w, h);
  }, [hue]);

  useEffect(() => {
    onChange(hsvToHex(hue, sat, val));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hue, sat, val]);

  // Close on outside click.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFromSquare = (clientX: number, clientY: number) => {
    const canvas = squareRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    setSat((x / rect.width) * 100);
    setVal(100 - (y / rect.height) * 100);
  };

  const updateFromHue = (clientX: number) => {
    const strip = hueRef.current;
    if (!strip) return;
    const rect = strip.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    setHue((x / rect.width) * 360);
  };

  const hex = hsvToHex(hue, sat, val);

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-3 w-[240px] rounded-2xl border border-white/10 bg-[#0f0f14] p-4 shadow-2xl"
    >
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Close color picker"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div className="relative">
        <canvas
          ref={squareRef}
          width={208}
          height={150}
          className="w-full h-[150px] rounded-lg cursor-crosshair touch-none block"
          onPointerDown={(e) => {
            draggingSquare.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            updateFromSquare(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (draggingSquare.current) updateFromSquare(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            draggingSquare.current = false;
          }}
        />
        <div
          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.6)] pointer-events-none"
          style={{
            left: `${sat}%`,
            top: `${100 - val}%`,
            backgroundColor: hex,
          }}
        />
      </div>

      <div
        ref={hueRef}
        className="relative mt-3 h-4 rounded-full cursor-pointer touch-none"
        style={{
          background:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
        onPointerDown={(e) => {
          draggingHue.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          updateFromHue(e.clientX);
        }}
        onPointerMove={(e) => {
          if (draggingHue.current) updateFromHue(e.clientX);
        }}
        onPointerUp={() => {
          draggingHue.current = false;
        }}
      >
        <div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{ left: `${(hue / 360) * 100}%`, backgroundColor: `hsl(${hue}, 100%, 50%)` }}
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <div
          className="h-7 w-7 rounded-full border border-white/15 shrink-0"
          style={{ backgroundColor: hex }}
        />
        <span className="text-xs font-mono text-white/60 tracking-wide">{hex}</span>
      </div>
    </div>
  );
}

export default ColorWheelPicker;
