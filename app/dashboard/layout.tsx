"use client";

import React, { PropsWithChildren } from "react";
import { ToastContainer } from "react-toastify";
import ResponsiveNavbar from "../components/Navbar";

export const dynamic = "force-static";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <ToastContainer toastClassName="font-vazir-force text-center" />
      <div className="flex flex-col md:flex-row min-h-dvh">
        <nav className="flex-none md:h-dvh md:w-2xs">
          <ResponsiveNavbar />
        </nav>
        <main className="flex-auto flex flex-col md:min-h-dvh">{children}</main>
      </div>
    </>
  );
}
