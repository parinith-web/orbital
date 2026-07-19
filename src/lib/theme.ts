const STORAGE_KEY = "chatColor";
const DEFAULT_CHAT_COLOR = "#ffffff";

export function hexToHsl(hex: string): [number, number, number] {
  let value = hex.trim();
  if (!value.startsWith("#")) value = `#${value}`;

  const r = parseInt(value.substring(1, 3), 16) / 255;
  const g = parseInt(value.substring(3, 5), 16) / 255;
  const b = parseInt(value.substring(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function getContrastColor(hex: string): string {
  if (!hex || typeof hex !== "string") return "#ffffff";

  let value = hex.replace("#", "");
  if (value.length === 3) {
    value = `${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`;
  }
  if (value.length !== 6) return "#ffffff";

  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "#ffffff";

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 128 ? "#000000" : "#ffffff";
}

export function applyThemeToRoot(
  color: string,
  root: HTMLElement = document.documentElement,
) {
  try {
    const [h, s] = hexToHsl(color);
    root.style.setProperty("--theme-bg-base", `${h} ${s * 0.4}% 6.5%`);
    root.style.setProperty("--theme-bg-surface", `${h} ${s * 0.3}% 4%`);
    root.style.setProperty("--theme-bg-hover", `${h} ${s * 0.5}% 15%`);
    root.style.setProperty("--theme-border", `${h} ${s * 0.3}% 14%`);
    root.style.setProperty("--theme-accent-color", color);
    root.style.setProperty("--theme-text-on-accent", getContrastColor(color));
    root.dataset.themeReady = "true";
  } catch (error) {
    console.error("Failed to apply theme", error);
  }
}

export function getInitialThemeColor() {
  if (typeof window === "undefined") return DEFAULT_CHAT_COLOR;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_CHAT_COLOR;
}

export function getThemeBootstrapScript() {
  return `(() => {
    const storageKey = "${STORAGE_KEY}";
    const fallbackColor = "${DEFAULT_CHAT_COLOR}";
    const hexToHsl = ${hexToHsl.toString()};
    const getContrastColor = ${getContrastColor.toString()};
    const applyThemeToRoot = ${applyThemeToRoot.toString()};
    try {
      const savedColor = window.localStorage.getItem(storageKey) || fallbackColor;
      applyThemeToRoot(savedColor, document.documentElement);
    } catch (error) {
      applyThemeToRoot(fallbackColor, document.documentElement);
    }
  })();`;
}

export { DEFAULT_CHAT_COLOR, STORAGE_KEY };
