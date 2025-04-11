"use client";
import dynamic from "next/dynamic";
import { ThemeProvider, useTheme } from "../components/ThemeProvider";
import React, { type PropsWithChildren } from "react";

const Navbar = dynamic(() => import("../components/Navbar"), { ssr: false });

function LayoutContent({ children }: PropsWithChildren) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-900"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-col md:flex-row min-h-dvh">
        <nav
          className="flex-none md:h-dvh md:w-72 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-md sticky top-0 z-20"
          style={{
            backgroundColor: "var(--box-bg)",
            borderColor: "var(--box-border)",
          }}
        >
          <Navbar />
        </nav>
        <main
          className="flex-auto flex flex-col md:min-h-dvh bg-white dark:bg-gray-800 md:bg-gray-50 md:dark:bg-gray-900"
          style={{
            backgroundColor: "var(--box-bg)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}
