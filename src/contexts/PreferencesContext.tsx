"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface PreferencesContextType {
  mentionSound: string;
  setMentionSound: (sound: string) => void;
  mentionSoundName: string;
  setMentionSoundName: (name: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined,
);

const DEFAULT_MENTION_SOUND = "/assets/mention.wav";
const DEFAULT_MENTION_SOUND_NAME = "mention.wav";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [mentionSound, setMentionSound] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        window.localStorage.getItem("mentionSound") || DEFAULT_MENTION_SOUND
      );
    }
    return DEFAULT_MENTION_SOUND;
  });

  const [mentionSoundName, setMentionSoundName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        window.localStorage.getItem("mentionSoundName") ||
        DEFAULT_MENTION_SOUND_NAME
      );
    }
    return DEFAULT_MENTION_SOUND_NAME;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mentionSound", mentionSound);
      window.localStorage.setItem("mentionSoundName", mentionSoundName);
    }
  }, [mentionSound, mentionSoundName]);

  return (
    <PreferencesContext.Provider
      value={{
        mentionSound,
        setMentionSound,
        mentionSoundName,
        setMentionSoundName,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used inside PreferencesProvider");
  }
  return ctx;
}
