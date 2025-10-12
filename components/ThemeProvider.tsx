"use client";

import { Theme as RadixTheme } from "@radix-ui/themes";
import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

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

function getInitialTheme(defaultTheme: ThemeMode) {
  if (typeof window === "undefined") return defaultTheme;

  const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
  if (savedTheme) return savedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : defaultTheme;
}

export default function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    setTheme(getInitialTheme(defaultTheme));
  }, [defaultTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light-theme", "dark-theme");
    root.classList.add(`${theme}-theme`);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: ThemeMode) => {
      localStorage.setItem("theme", theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      <RadixTheme
        appearance={theme}
        accentColor="indigo"
        scaling="100%"
        radius="medium"
      >
        {children}
      </RadixTheme>
    </ThemeProviderContext.Provider>
  );
}
