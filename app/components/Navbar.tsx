/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, HTMLAttributes } from "react";
import Link from "next/link";
import { AiOutlinePlus } from "react-icons/ai";
import { FaRegMoneyBill1 } from "react-icons/fa6";
import { CiSettings } from "react-icons/ci";
import { MdLogout } from "react-icons/md";
import { RxCross1, RxHamburgerMenu } from "react-icons/rx";
import { handleLogout } from "@/lib/logout";
import { useRouter } from "next/navigation";
import { Chat, getChatsForNavbar, newChatListener } from "@/lib/chatDB";

// A simple wrapper that places an onClick on a parent div for links.
interface LinkWrapperProps extends HTMLAttributes<HTMLDivElement> {
  href: string;
  prefetch?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
const LinkWrapper: React.FC<LinkWrapperProps> = ({
  href,
  onClick,
  children,
  prefetch = true,
  ...props
}) => (
  <Link href={href} prefetch={prefetch}>
    <div
      onClick={onClick}
      className={
        "w-[inherit] h-[inherit] cursor-pointer" +
        (props.className ? ` ${props.className}` : "")
      }
    >
      {children}
    </div>
  </Link>
);

interface NavContentProps {
  chats: Chat[];
  onLinkClick: () => void;
}

// NavContent uses a flex layout to separate the header, search bar,
// independently scrollable chat list, and footer actions.
const NavContent: React.FC<NavContentProps> = ({ chats, onLinkClick }) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filteredChats, setFilteredChats] = useState(chats);

  // Filter chats based on search (case-insensitive).
  //   const filteredChats =
  useEffect(() => {
    setFilteredChats(
      chats.filter((chat) =>
        chat.namePrefix.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, chats]);

  return (
    <div className="flex flex-col md:h-dvh text-black-700 min-h-0 ">
      {/* Header */}
      <header className="hidden md:block p-2 md:border-b-2 md:border-gray-300">
        <h1 className="text-2xl font-bold text-center hidden md:block">
          سپهر AI
        </h1>
        <LinkWrapper
          href="/dashboard"
          onClick={onLinkClick}
          className="text-center hidden md:flex mt-4 p-2 hover:bg-black hover:text-white hover:border-b-gray-700 rounded-md border-2 border-gray-600"
        >
          <div className="flex items-center gap-2 h-full">
            <AiOutlinePlus />
            <span className="text-center">چت جدید</span>
          </div>
        </LinkWrapper>
      </header>

      {/* Chat List (scrollable) */}
      <div className="mt-2 md:w-full flex-1 overflow-y-auto md:overflow-hidden md:hover:overflow-y-auto pl-1 pr-4">
        <input
          type="text"
          placeholder="جستجو در چت ها ..."
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-2 p-2 rounded-xl border-2 border-gray-300 placeholder-gray-400 focus:outline-none"
        />

        {filteredChats.length > 0 ? (
          <div className="grid grid-cols-2 ml mr-auto md:block">
            {filteredChats.map((chat, idx) => (
              <div
                key={idx}
                className="m-1 border-1 rounded-xl border-gray-800 md:border-0"
              >
                <LinkWrapper
                  onClick={onLinkClick}
                  className="text-ellipsis p-2 rounded-xl hover:bg-black hover:text-white text-sm"
                  href={`/dashboard/chat/${chat.uuid}`}
                >
                  {chat.namePrefix}
                </LinkWrapper>
              </div>
            ))}
          </div>
        ) : chats.length ? (
          <p className="text-center text-sm">چت مورد نظر پیدا نشد!</p>
        ) : (
          <p className="text-center text-sm h-full content-center">فاقد چت.</p>
        )}
      </div>

      {/* Footer Actions */}
      <footer className="mt-2 px-3 py-0.5">
        <LinkWrapper href="/dashboard/payment" onClick={onLinkClick}>
          <div className="flex gap-2 items-center p-2 hover:bg-black hover:text-white hover:rounded">
            <FaRegMoneyBill1 />
            شارژ اکانت
          </div>
        </LinkWrapper>
        {/* href="/dashboard/settings" */}
        <LinkWrapper href="/dashboard" onClick={onLinkClick}>
          <div className="flex gap-2 items-center p-2 hover:bg-black hover:text-white hover:rounded">
            <CiSettings />
            تنظیمات
          </div>
        </LinkWrapper>
        <button
          onClick={() => handleLogout(router)}
          className="w-full flex gap-2 items-center p-2 hover:bg-black hover:text-white hover:rounded"
        >
          <MdLogout />
          خروج از حساب کاربری
        </button>
      </footer>
    </div>
  );
};

export default function ResponsiveNavbar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Load initial chats and listen for new chat events.
  useEffect(() => {
    const fetchChats = async () => {
      const initialChats = await getChatsForNavbar();
      setChats(initialChats);
    };

    fetchChats();

    const removeListener = newChatListener((e: any) => {
      if (!e.detail) return;
      const { newChat } = e.detail as { newChat: Chat };
      setChats((prev) => [newChat, ...prev]);
    });
    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  const handleLinkClick = () => {
    if (isMobileNavOpen) setIsMobileNavOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:inset-y-0 w-[inherit] p-2 rounded-l-2xl fixed shadow-xl shadow-gray-600">
        <NavContent chats={chats} onLinkClick={handleLinkClick} />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex-none flex items-center justify-between p-4">
        <button
          className="text-xl"
          onClick={() => setIsMobileNavOpen((s) => !s)}
        >
          {!isMobileNavOpen ? <RxHamburgerMenu /> : <RxCross1 />}
        </button>
        <h1 className="text-xl font-bold">سپهر AI</h1>
        <button className="text-2xl">
          <LinkWrapper href="/dashboard" onClick={handleLinkClick}>
            <AiOutlinePlus />
          </LinkWrapper>
        </button>
      </div>

      {/* Mobile Fullscreen Navbar Overlay */}
      {isMobileNavOpen && (
        <>
          <div className="hide-the-main"></div>
          <div className="md:hidden inset-0 z-50 bg-opacity-95 bg-white flex flex-col min-h-0">
            <NavContent chats={chats} onLinkClick={handleLinkClick} />
          </div>
        </>
      )}
    </>
  );
}
