"use client";

import React, { PropsWithChildren, useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { BsPlusLg } from "react-icons/bs";
import Sidebar from "./components/Sidebar";
import MobileSiderbar from "./components/MobileSidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Layout({ children }: PropsWithChildren) {
  const [isComponentVisible, setIsComponentVisible] = useState(false);
  const pathname = usePathname();
  const provider = pathname.startsWith("/dashboard/openai")
    ? "OpenAI"
    : "هوش مصنوعی";

  return (
    <main className="w-full flex min-h-screen">
      {isComponentVisible ? (
        <MobileSiderbar
          isComponentVisible={isComponentVisible}
          setIsComponentVisible={setIsComponentVisible}
        />
      ) : null}
      <div className="dark hidden flex-shrink-0 bg-gray-900 md:flex md:w-[260px] md:flex-col">
        <div className="flex min-h-0 flex-col fixed w-[inherit]">
          <Sidebar />
        </div>
      </div>
      <div className="min-h-screen flex max-w-full flex-1 flex-col">
        {/* Header with sidebar toggle */}
        <div className="flex-none sticky top-0 z-10 flex items-center border-b border-white/20 bg-gray-800 pl-1 pt-1 text-gray-200 sm:pl-3 md:hidden">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white dark:hover:text-white"
            onClick={() => setIsComponentVisible(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <RxHamburgerMenu className="h-6 w-6 text-white" />
          </button>
          <h1 className="flex-1 text-center text-base font-normal">
            {provider}
          </h1>
          <Link href="/dashboard">
            <button type="button" className="px-3">
              <BsPlusLg className="h-6 w-6" />
            </button>
          </Link>
        </div>

        {children}
      </div>
    </main>
  );
}
