"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import {
  applyThemeToRoot,
  DEFAULT_CHAT_COLOR,
  getContrastColor,
  getInitialThemeColor,
} from "@/lib/theme";

interface ColorContextType {
  color: string;
  textColor: string;
  isThemeReady: boolean;
  setColor: React.Dispatch<React.SetStateAction<string>>;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<string>(() => getInitialThemeColor());
  const [isThemeReady, setIsThemeReady] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.themeReady === "true";
  });
  const textColor = useMemo(() => getContrastColor(color), [color]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextColor = color || DEFAULT_CHAT_COLOR;
    window.localStorage.setItem("chatColor", nextColor);
    applyThemeToRoot(nextColor);
    setIsThemeReady(true);
  }, [color]);

  return (
    <ColorContext.Provider value={{ color, textColor, isThemeReady, setColor }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColor() {
  const ctx = useContext(ColorContext);
  if (!ctx) {
    throw new Error("useColor must be used inside ColorProvider");
  }
  return ctx;
}
