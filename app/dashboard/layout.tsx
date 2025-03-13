"use client";

import React, { PropsWithChildren } from "react";
import ResponsiveNavbar from "../components/Navbar";

export const dynamic = "force-static";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="flex flex-col md:flex-row min-h-dvh">
        <nav className="flex-none md:h-dvh md:w-2xs">
          <ResponsiveNavbar />
        </nav>
        <main className="flex-auto flex flex-col md:min-h-dvh">{children}</main>
      </div>
    </>
  );
}
