"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { type ChatSession, getChat } from "@/lib/chatDB";
import React, { useEffect, useState, useRef, use } from "react";

const ChatBody = dynamic(() => import("@/components/Chat/ChatBody"), {
  ssr: false,
});

export default function ChatComponent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: chatId } = use(params);
  if (!chatId) router.replace("/dashboard");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showSpinner, setShowSpinner] = useState(true);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [chatInitialSession, setChatInitialSession] =
    useState<ChatSession | null>(null);

  useEffect(() => {
    if (chatId) {
      const fetchChats = async () => {
        const stored = await getChat(chatId);
        if (stored) {
          setChatInitialSession(stored);
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        } else router.replace("/dashboard");
      };

      fetchChats();
    } else {
      timerRef.current = setTimeout(() => setShowSpinner(true), 200);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chatId, router]);

  if (chatInitialSession === null) {
    return showSpinner ? <Loading /> : <div></div>;
  }

  return (
    <div className="flex flex-col w-full h-full">
      <ChatBody
        router={router}
        uuid={chatId as string}
        textAreaRef={textAreaRef}
        engineCode={chatInitialSession.engineCode}
        initialMessages={chatInitialSession?.messages}
        aiCompanyWebsite={chatInitialSession.aiCompanyWebsite}
      />
    </div>
  );
}
