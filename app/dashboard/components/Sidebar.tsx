"use client";

import Link from "next/link";
import React, { MouseEvent, useEffect, useState } from "react";
import { MdLogout } from "react-icons/md";
import { AiOutlinePlus } from "react-icons/ai";
import {
  Chat,
  getChatsForNavbar,
  NewChatEventMap,
  newChatListener,
} from "@/app/chat/lib";
import { ChatProvider } from "@/lib/ai-providers";
import { SiOpenai } from "react-icons/si";
import { useRouter } from "next/navigation";

export default function Sidebar({
  setIsComponentVisible,
}: {
  setIsComponentVisible?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [openAiChats, setOpenAiChats] = useState<Chat[]>([
    { uuid: "", namePrefix: "در حال بارگزاری چت ها ..." },
  ]);

  useEffect(() => {
    setOpenAiChats(getChatsForNavbar(ChatProvider.OpenAi));

    return newChatListener((e: CustomEventInit<NewChatEventMap>) => {
      if (!e.detail) return;
      const detail = e.detail as NewChatEventMap;

      if (detail.provider == ChatProvider.OpenAi) {
        setOpenAiChats((chats) => [detail.newChat, ...chats] as Chat[]);
      }
    });
  }, []);

  const linkHandler = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (setIsComponentVisible) setIsComponentVisible(false);
    router.push(href);
  };

  return (
    <div className="flex w-full flex-1 items-start border-white/20">
      <nav className="flex flex-1 flex-col space-y-1 p-2">
        <a
          className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20"
          onClick={linkHandler("/dashboard")}
        >
          <AiOutlinePlus className="h-4 w-4" />
          چت جدید
        </a>
        {openAiChats.map((chat, index) => (
          <div className="flex-col flex-1 overflow-y-auto" key={index}>
            <div className="flex flex-col gap-2 pb-2 text-gray-100 text-sm">
              <a
                className="flex py-3 px-3 items-center gap-3 relative rounded-md hover:bg-[#2A2B32] cursor-pointer break-all hover:pr-4 group"
                onClick={linkHandler(
                  `/dashboard/${ChatProvider.OpenAi as string}/${chat.uuid}`
                )}
              >
                <SiOpenai className="h-4 w-4" />
                <div className="flex-1 text-ellipsis max-h-5 break-all relative">
                  {chat.namePrefix}
                </div>
              </a>
            </div>
          </div>
        ))}
        <div className="border-t border-white/20">
          <Link
            className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm"
            href="/logout"
          >
            <MdLogout className="h-4 w-4" />
            خروج از حساب کاربری
          </Link>
        </div>
      </nav>
    </div>
  );
}
