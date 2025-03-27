"use client";

import dynamic from "next/dynamic";
import React, { PropsWithChildren } from "react";

const Navbar = dynamic(() => import("../components/Navbar"), { ssr: false });

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className="flex flex-col md:flex-row min-h-dvh">
        <nav className="flex-none md:h-dvh md:w-2xs">
          <Navbar />
        </nav>
        <main className="flex-auto flex flex-col md:min-h-dvh">{children}</main>
      </div>
    </>
  );
}
