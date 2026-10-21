"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemeChoice = "light" | "dark" | "system";

type ThemePreferenceContextValue = {
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
};

const storageKey = "sdms-theme-preference";
const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);
const listeners = new Set<() => void>();
let memoryTheme: ThemeChoice | undefined;

function isThemeChoice(value: string | null): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(theme: ThemeChoice) {
  const useDark = theme === "dark" || (
    theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  document.documentElement.dataset.theme = useDark ? "dark" : "light";
}

function subscribeToTheme(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getThemeSnapshot(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (isThemeChoice(stored)) return stored;
  } catch {
    // Fall back to the in-memory choice when browser storage is unavailable.
  }
  return memoryTheme ?? "system";
}

function getServerThemeSnapshot(): ThemeChoice {
  return "system";
}

function storeTheme(theme: ThemeChoice) {
  memoryTheme = theme;
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Theme changes still apply for this session when storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

export function ThemePreferencesProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (theme === "system") applyTheme("system");
    };
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeChoice) => {
    storeTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const value = useContext(ThemePreferenceContext);
  if (!value) throw new Error("Theme preferences must be used within ThemePreferencesProvider.");
  return value;
}
