"use client";

import { Theme } from "@radix-ui/themes";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type ThemeMode = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
};

export type ThemeProviderState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function useTheme() {
  return useContext(ThemeProviderContext);
}

function getInitialTheme(defaultTheme: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return defaultTheme; // SSR
  const saved = localStorage.getItem("theme") as ThemeMode | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : defaultTheme;
}

export default function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  // Initialize from localStorage or system preference without an effect
  const [theme, _setTheme] = useState<ThemeMode>(() =>
    getInitialTheme(defaultTheme),
  );

  // Wrap setter to also persist to localStorage
  const setTheme = useCallback((t: ThemeMode) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
    _setTheme(t);
  }, []);

  // Sync <html> classes with current theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light-theme", "dark-theme");
    root.classList.add(`${theme}-theme`);
  }, [theme]);

  // Update when system theme changes, but only if the user hasn't chosen explicitly
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem("theme") as ThemeMode | null;
      if (!saved) _setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener?.("change", handleChange);
    return () => mq.removeEventListener?.("change", handleChange);
  }, []);

  const value: ThemeProviderState = { theme, setTheme };

  return (
    <ThemeProviderContext.Provider value={value}>
      <Theme
        appearance={theme}
        accentColor="indigo"
        scaling="100%"
        radius="medium"
      >
        {children}
      </Theme>
    </ThemeProviderContext.Provider>
  );
}
