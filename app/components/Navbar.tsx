/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import Link from "next/link";
import { MdLogout } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { handleLogout } from "@/lib/logout";
import { useRouter } from "next/navigation";
import { AiOutlinePlus } from "react-icons/ai";
import { FaRegMoneyBill1 } from "react-icons/fa6";
import { RxCross1, RxHamburgerMenu } from "react-icons/rx";
import { type DbChat, getChatsForNavbar, newChatListener } from "@/lib/chatDB";
import React, {
  useRef,
  type FC,
  useState,
  useEffect,
  type ReactNode,
  type HTMLAttributes,
} from "react";

// A simple wrapper that places an onClick on a parent div for links.
interface LinkWrapperProps extends HTMLAttributes<HTMLDivElement> {
  href: string;
  prefetch?: boolean;
  onClick: () => void;
  children: ReactNode;
}
const LinkWrapper: FC<LinkWrapperProps> = ({
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
  chats: DbChat[];
  onLinkClick: () => void;
}

// NavContent uses a flex layout to separate the header, search bar,
// independently scrollable chat list, and footer actions.
const NavContent: FC<NavContentProps> = ({ chats, onLinkClick }) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filteredChats, setFilteredChats] = useState(chats);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // Check overflow on mount and when filtered chats change
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasOverflow = container.scrollHeight > container.clientHeight;
      setShowBottomShadow(hasOverflow);
    }
  }, [filteredChats]); // Also triggers when chats update

  // Filter chats based on search (case-insensitive).
  useEffect(() => {
    setFilteredChats(
      chats.filter((chat) =>
        chat.value.namePrefix.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, chats]);

  return (
    <div className="flex flex-col md:h-dvh text-black-700 min-h-0 ">
      {/* Header */}
      <header className="hidden md:block p-2">
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
      <div
        ref={scrollContainerRef}
        className={`mt-2 md:w-full flex-1 overflow-y-auto px-2 relative ${
          showBottomShadow ? "shadow-bottom" : ""
        }`}
        style={{ scrollbarWidth: "none" }}
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
        }}
      >
        <style jsx>{`
          .shadow-bottom::after {
            content: "";
            position: sticky;
            bottom: 0;
            display: block;
            height: 2rem;
            background: linear-gradient(
              to top,
              rgba(255, 255, 255, 1) 5%,
              rgba(255, 255, 255, 0) 50%
            );
            pointer-events: none;
          }
        `}</style>
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
                  href={`/dashboard/chat/${chat.key}`}
                >
                  {chat.value.namePrefix}
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
  const [chats, setChats] = useState<DbChat[]>([]);
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
      const newChat = e.detail as DbChat;
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
