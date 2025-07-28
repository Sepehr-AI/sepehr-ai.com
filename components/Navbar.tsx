"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../components/ThemeProvider";
import * as Separator from "@radix-ui/react-separator";
import { type DbChat, getChatsForNavbar, newChatListener } from "@/lib/chatDB";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  HamburgerMenuIcon,
  Cross1Icon,
  ExitIcon,
  GearIcon,
  LightningBoltIcon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";

// A reusable sidebar link component
const SidebarLink = ({
  href,
  children,
  onClick,
  isActive = false,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}) => (
  <Link href={href} className="block w-full" onClick={onClick}>
    <div
      className={`text-right rtl px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${isActive ? "bg-accent/10 text-accent font-medium" : "hover:bg-black/15 dark:hover:bg-muted/60"}`}
    >
      {children}
    </div>
  </Link>
);

// Navigation content component
const NavContent = ({
  chats,
  onLinkClick,
  currentChatId,
}: {
  chats: DbChat[];
  onLinkClick: () => void;
  currentChatId?: string;
}) => {
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filteredChats, setFilteredChats] = useState(chats);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // Filter chats based on search
  useEffect(() => {
    setFilteredChats(
      chats.filter((chat) =>
        chat.value.namePrefix.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [search, chats]);

  // Check for scroll shadow
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasOverflow = container.scrollHeight > container.clientHeight;
      setShowBottomShadow(hasOverflow);
    }
  }, [filteredChats]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 flex-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1"></div>

          <div className="flex-none flex items-center gap-2">
            <h1 className="font-semibold text-lg text-center">سپهر AI</h1>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 p-1.5 rounded-md transition-colors flex"
          >
            <div className="flex-auto"></div>
            <div className="flex-none p-1 rounded-md hover:bg-muted/80">
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </div>
          </button>
        </div>

        <SidebarLink href="/dashboard" onClick={onLinkClick}>
          <PlusIcon />
          <span>چت جدید</span>
        </SidebarLink>

        <div className="relative mt-4">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={search}
            placeholder="جستجو در چت ها ..."
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 pr-9 rounded-md bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-accent/50 text-sm"
          />
        </div>
      </div>

      {/* Chat List (scrollable) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-2 relative"
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
              var(--gradient-from),
              var(--gradient-to)
            );
            pointer-events: none;
          }
        `}</style>

        {filteredChats.length > 0 ? (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <SidebarLink
                key={chat.key}
                href={`/dashboard/chat/${chat.key}`}
                onClick={onLinkClick}
                isActive={currentChatId === chat.key}
              >
                <div className="w-full truncate">{chat.value.namePrefix}</div>
              </SidebarLink>
            ))}
            {showBottomShadow && (
              <div
                className="shadow-bottom"
                style={
                  {
                    "--gradient-from":
                      theme === "dark"
                        ? "rgba(10, 10, 10, 1)"
                        : "rgba(255, 255, 255, 1)",
                    "--gradient-to":
                      theme === "dark"
                        ? "rgba(10, 10, 10, 0)"
                        : "rgba(255, 255, 255, 0)",
                  } as React.CSSProperties
                }
              />
            )}
          </div>
        ) : chats.length ? (
          <div className="text-center text-sm text-foreground/60 py-4">
            چت مورد نظر پیدا نشد!
          </div>
        ) : (
          <div className="text-center text-sm text-foreground/60 py-4">
            فاقد چت.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-none p-3 space-y-1">
        <Separator.Root className="bg-border h-px w-full my-2" />

        <SidebarLink href="/dashboard/payment" onClick={onLinkClick}>
          <LightningBoltIcon />
          <span>شارژ اکانت</span>
        </SidebarLink>

        <SidebarLink href="/dashboard" onClick={onLinkClick}>
          <GearIcon />
          <span>تنظیمات</span>
        </SidebarLink>

        <a href="/logout">
          <button className="w-full px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 hover:bg-black/15 dark:hover:bg-muted/60 hover:text-destructive">
            <ExitIcon />
            <span>خروج از حساب کاربری</span>
          </button>
        </a>
      </div>
    </div>
  );
};

export default function Navbar() {
  const pathname = usePathname();
  const [chats, setChats] = useState<DbChat[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathSegments = pathname?.split("/") || [];
  const currentChatId =
    pathSegments.length > 3 && pathSegments[2] === "chat"
      ? pathSegments[3]
      : undefined;

  // Load initial chats and listen for new chat events.
  useEffect(() => {
    const fetchChats = async () => {
      const initialChats = await getChatsForNavbar();
      setChats(initialChats);
    };
    fetchChats();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="hidden md:block h-full">
        <NavContent
          chats={chats}
          onLinkClick={handleLinkClick}
          currentChatId={currentChatId}
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-border">
        <button
          className="p-1.5 rounded-md hover:bg-muted/60 transition-colors"
          onClick={() => setIsMobileNavOpen((prev) => !prev)}
        >
          {isMobileNavOpen ? <Cross1Icon /> : <HamburgerMenuIcon />}
        </button>

        <div className="flex items-center gap-2">
          <h1 className="font-semibold">سپهر AI</h1>
        </div>

        <Link
          href="/dashboard"
          className="p-1.5 rounded-md hover:bg-muted/60 transition-colors"
        >
          <PlusIcon />
        </Link>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileNavOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border md:hidden">
            <NavContent
              chats={chats}
              onLinkClick={handleLinkClick}
              currentChatId={currentChatId}
            />
          </div>
        </>
      )}
    </>
  );
}
