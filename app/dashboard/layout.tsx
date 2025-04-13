"use client";

import dynamic from "next/dynamic";
import React, { type PropsWithChildren } from "react";
import ThemeProvider from "@/components/ThemeProvider";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

export default function Layout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <div className="flex flex-col md:flex-row h-dvh bg-background text-foreground">
        <nav className="flex-none md:h-dvh md:sticky md:top-0 md:w-72 border-r border-border">
          <Navbar />
        </nav>
        <main className="flex-auto flex flex-col h-full overflow-x-hidden overflow-y-auto md:h-dvh">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
