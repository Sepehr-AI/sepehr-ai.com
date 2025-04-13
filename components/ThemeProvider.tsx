"use client";

import { Theme } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
};

type ThemeProviderState = {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function useTheme() {
  return useContext(ThemeProviderContext);
}

export default function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">(defaultTheme);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, [pathname]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light-theme", "dark-theme");
    root.classList.add(`${theme}-theme`);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: "light" | "dark") => {
      localStorage.setItem("theme", theme);
      setTheme(theme);
    },
  };

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
