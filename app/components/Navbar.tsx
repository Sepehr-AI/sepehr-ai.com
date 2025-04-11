/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { MdLogout } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { handleLogout } from "@/lib/logout";
import { useRouter } from "next/navigation";
import { FiPlus, FiSearch, FiMoon, FiSun } from "react-icons/fi";
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
import { useTheme } from "./ThemeProvider";

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

const NavContent: FC<NavContentProps> = ({ chats, onLinkClick }) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { isDarkMode, toggleDarkMode } = useTheme();
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
  }, [filteredChats]);

  // Filter chats based on search
  useEffect(() => {
    setFilteredChats(
      chats.filter((chat) =>
        chat.value.namePrefix.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, chats]);

  return (
    <div
      className="flex flex-col h-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800"
      dir="rtl"
    >
      {/* Header */}
      <header className="p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">سپهر AI</h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            aria-label={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {isDarkMode ? (
              <FiSun className="w-5 h-5" />
            ) : (
              <FiMoon className="w-5 h-5" />
            )}
          </button>
        </div>

        <LinkWrapper
          href="/dashboard"
          onClick={onLinkClick}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-md"
        >
          <FiPlus className="text-white" />
          <span>چت جدید</span>
        </LinkWrapper>
      </header>

      {/* Search and Chat List */}
      <div className="px-4 py-3 sticky top-[116px] z-10 bg-white dark:bg-gray-800">
        <div className="relative mb-4">
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="جستجو در چت ها ..."
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 px-10 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* Chat List (scrollable) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pb-4 relative"
        style={{ scrollbarWidth: "thin" }}
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
        }}
      >
        {filteredChats.length > 0 ? (
          <div className="space-y-2">
            {filteredChats.map((chat, idx) => (
              <LinkWrapper
                key={idx}
                onClick={onLinkClick}
                href={`/dashboard/chat/${chat.key}`}
                className="block w-full"
              >
                <div className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 hover:border-emerald-100 dark:hover:border-emerald-800 transition-all group shadow-sm">
                  <div className="truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {chat.value.namePrefix}
                  </div>
                </div>
              </LinkWrapper>
            ))}
          </div>
        ) : chats.length ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            چت مورد نظر پیدا نشد!
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            فاقد چت. برای شروع، یک چت جدید ایجاد کنید.
          </div>
        )}

        {/* Bottom shadow indicator for scrolling */}
        {showBottomShadow && (
          <div className="sticky bottom-0 h-12 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* Footer Actions */}
      <footer className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-2 sticky bottom-0 bg-white dark:bg-gray-800 shadow-md z-10">
        <LinkWrapper href="/dashboard/payment" onClick={onLinkClick}>
          <div className="flex gap-2 items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <FaRegMoneyBill1 className="text-gray-500 dark:text-gray-400" />
            <span>شارژ اکانت</span>
          </div>
        </LinkWrapper>
        <LinkWrapper href="/dashboard" onClick={onLinkClick}>
          <div className="flex gap-2 items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <CiSettings className="text-gray-500 dark:text-gray-400" />
            <span>تنظیمات</span>
          </div>
        </LinkWrapper>
        <button
          onClick={() => handleLogout(router)}
          className="w-full flex gap-2 items-center p-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        >
          <MdLogout />
          <span>خروج از حساب کاربری</span>
        </button>
      </footer>
    </div>
  );
};

export default function ResponsiveNavbar() {
  const { isDarkMode, toggleDarkMode } = useTheme();
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
      <div className="hidden md:flex md:flex-col h-full">
        <NavContent chats={chats} onLinkClick={handleLinkClick} />
      </div>

      {/* Mobile Header */}
      <div
        className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-md"
        dir="rtl"
      >
        <button
          className="text-gray-700 dark:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setIsMobileNavOpen((s) => !s)}
        >
          {!isMobileNavOpen ? <RxHamburgerMenu /> : <RxCross1 />}
        </button>
        <h1 className="text-xl font-bold dark:text-white">سپهر AI</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            aria-label={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {isDarkMode ? <FiSun /> : <FiMoon />}
          </button>
          <Link href="/dashboard">
            <button className="text-emerald-500 dark:text-emerald-400 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/30">
              <FiPlus />
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile Fullscreen Navbar Overlay */}
      {isMobileNavOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40"
            onClick={() => setIsMobileNavOpen(false)}
          ></div>
          <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-800 w-4/5 max-w-sm shadow-xl">
            <NavContent chats={chats} onLinkClick={handleLinkClick} />
          </div>
        </>
      )}
    </>
  );
}
