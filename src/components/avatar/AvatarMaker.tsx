"use client";

import { useEffect, useState } from "react";
import {
  AvatarConfig,
  COLOR_OPTIONS,
  DEFAULT_AVATAR_CONFIG,
  EYE_OPTIONS,
  HAT_OPTIONS,
  MOUTH_OPTIONS,
  decodeAvatarConfig,
  encodeAvatarConfig,
  randomAvatarConfig,
} from "@/lib/avatar/options";
import { AvatarSVG } from "./AvatarSVG";
import { CategoryCarousel } from "./CategoryCarousel";
import { ColorWheelPicker } from "./ColorWheelPicker";

type CategoryId = "color" | "eyes" | "mouth" | "hat";

const CATEGORIES: { id: CategoryId; label: string; count: string }[] = [
  { id: "color", label: "Color", count: `${COLOR_OPTIONS.length}` },
  { id: "eyes", label: "Eyes", count: `${EYE_OPTIONS.length}` },
  { id: "mouth", label: "Mouth", count: `${MOUTH_OPTIONS.length}` },
  { id: "hat", label: "Hat", count: `${HAT_OPTIONS.length}` },
];

const STORAGE_KEY = "orbit.avatarMaker.savedConfig";

interface AvatarMakerProps {
  /** Called whenever the user hits Save, with both the config and its
   * compact encoded string. Left as a no-op by default — wiring this to a
   * real profile field (Convex mutation, etc.) is the next step, not this
   * one. */
  onSave?: (config: AvatarConfig, code: string) => void;
  /** Called on every change to the config (color/eyes/mouth/hat picks and
   * randomize), independent of Save. For embedding the maker somewhere
   * that persists the avatar itself later — e.g. as one step of a signup
   * flow that saves username + avatar together at the end. */
  onChange?: (config: AvatarConfig, code: string) => void;
  initialConfig?: AvatarConfig;
  /** Hides the Save/copy-code/download-SVG row, which assume there's a
   * profile (or the demo localStorage slot) to persist to right now.
   * Useful when the maker is one step of a larger flow — pair with
   * `onChange` to read the current config instead. Randomize stays
   * visible either way. Defaults to false. */
  hideSaveControls?: boolean;
}

export function AvatarMaker({
  onSave,
  onChange,
  initialConfig,
  hideSaveControls = false,
}: AvatarMakerProps) {
  const [config, setConfig] = useState<AvatarConfig>(
    initialConfig ?? DEFAULT_AVATAR_CONFIG,
  );
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<CategoryId>("color");

  // Restore the last-saved local avatar on mount (demo persistence only —
  // no backend wired up yet, see onSave above).
  useEffect(() => {
    if (initialConfig) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setConfig(decodeAvatarConfig(raw));
    } catch {
      // localStorage unavailable (e.g. private browsing) — just fall back
      // to the default config, no need to surface an error for this.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSaved(false);
    onChange?.(config, encodeAvatarConfig(config));
    // Only re-run when the config itself changes — onChange is expected to
    // be a fresh closure each render for callers tracking local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const update = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleRandomize = () => setConfig(randomAvatarConfig());

  const handleSave = () => {
    const code = encodeAvatarConfig(config);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Non-fatal — saving is best-effort local persistence for this demo.
    }
    onSave?.(config, code);
    setSaved(true);
  };

  const handleCopyCode = async () => {
    const code = encodeAvatarConfig(config);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API can be blocked (permissions, insecure context) —
      // the code is still visible on screen for manual copy.
    }
  };

  const handleDownload = () => {
    const svgEl = document.getElementById("avatar-maker-preview-svg");
    if (!svgEl) return;
    // Clone rather than serialize the live node directly, so we can bump
    // the exported file up to a crisp fixed resolution without resizing
    // the on-screen preview.
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "512");
    clone.setAttribute("height", "512");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const serialized = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "avatar.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto text-white">
      <div className="grid md:grid-cols-[minmax(0,320px)_1fr] gap-8 md:gap-12 items-center">
        {/* Preview */}
        <div className="flex flex-col items-center">
          <div
            className="relative rounded-[28px] border-[3px] border-[#0b0b10] bg-[#0f0f0f] p-8 sm:p-10 transition-shadow duration-200"
            style={{ boxShadow: `8px 8px 0 0 ${config.color}` }}
          >
            <AvatarSVG
              id="avatar-maker-preview-svg"
              config={config}
              size={200}
              className="drop-shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 w-full">
            <button
              onClick={handleRandomize}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
            >
              Randomize
            </button>
            {!hideSaveControls && (
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-full text-sm font-medium border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                {saved ? "Saved ✓" : "Save avatar"}
              </button>
            )}
          </div>

          {!hideSaveControls && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleCopyCode}
                className="text-xs text-[#888] hover:text-white transition-colors underline underline-offset-2 decoration-white/20"
              >
                {copied ? "Code copied ✓" : "Copy avatar code"}
              </button>
              <span className="text-[#444] text-xs">·</span>
              <button
                onClick={handleDownload}
                className="text-xs text-[#888] hover:text-white transition-colors underline underline-offset-2 decoration-white/20"
              >
                Download SVG
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5 w-full min-w-0">
          {/* Tab bar — pick a feature, then browse just that one row */}
          <div className="flex gap-1.5 p-1 rounded-full bg-white/[0.04] border border-white/10 w-fit max-w-full overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === cat.id
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">
              {CATEGORIES.find((c) => c.id === activeTab)?.label}
            </h3>
            {activeTab !== "color" && (
              <span className="text-xs text-[#666]">
                {CATEGORIES.find((c) => c.id === activeTab)?.count} styles
              </span>
            )}
          </div>

          {/* Fixed-height wrapper so switching tabs never resizes the card —
              sized to the tallest tab content (the color picker); shorter
              tabs (eyes/mouth/hat) just top-align within it. */}
          <div className="min-h-[300px] flex flex-col">
            {/* Only the active category's row renders — no vertical stack of
                every feature at once, and each row scrolls horizontally
                instead of wrapping. */}
            {activeTab === "color" && (
              <ColorWheelPicker
                color={config.color}
                onChange={(hex) => update("color", hex)}
                embedded
              />
            )}

            {activeTab === "eyes" && (
              <CategoryCarousel resetKey="eyes">
                {EYE_OPTIONS.map((opt) => (
                  <ThumbButton
                    key={opt.id}
                    label={opt.label}
                    selected={config.eyes === opt.id}
                    onClick={() => update("eyes", opt.id)}
                    previewConfig={{ ...config, eyes: opt.id }}
                  />
                ))}
              </CategoryCarousel>
            )}

            {activeTab === "mouth" && (
              <CategoryCarousel resetKey="mouth">
                {MOUTH_OPTIONS.map((opt) => (
                  <ThumbButton
                    key={opt.id}
                    label={opt.label}
                    selected={config.mouth === opt.id}
                    onClick={() => update("mouth", opt.id)}
                    previewConfig={{ ...config, mouth: opt.id }}
                  />
                ))}
              </CategoryCarousel>
            )}

            {activeTab === "hat" && (
              <CategoryCarousel resetKey="hat">
                {HAT_OPTIONS.map((opt) => (
                  <ThumbButton
                    key={opt.id}
                    label={opt.label}
                    selected={config.hat === opt.id}
                    onClick={() => update("hat", opt.id)}
                    previewConfig={{ ...config, hat: opt.id }}
                  />
                ))}
              </CategoryCarousel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThumbButton({
  label,
  selected,
  onClick,
  previewConfig,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  previewConfig: AvatarConfig;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group shrink-0 snap-start flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition-all ${
        selected
          ? "border-white bg-white/[0.06]"
          : "border-transparent bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div
        className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden"
        style={{ backgroundColor: `${previewConfig.color}22` }}
      >
        <AvatarSVG config={previewConfig} size={64} />
      </div>
      <span className="text-[10px] sm:text-[11px] text-[#999] group-hover:text-white transition-colors text-center leading-tight whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

export default AvatarMaker;
