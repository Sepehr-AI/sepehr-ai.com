"use client";

import Chat from "@/app/components/Chat";
import { useRouter } from "next/navigation";
import Loading from "@/app/components/Loading";
import { aiMessageToSdkMessage } from "@/lib/vercel-ai";
import { type ChatSession, getChat } from "@/lib/chatDB";
import React, { useEffect, useState, useRef, use } from "react";

export const dynamic = "force-static";

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
    <Chat
      models={[]}
      uuid={chatId as string}
      engineCode={chatInitialSession.engineCode}
      aiCompanyWebsite={chatInitialSession.aiCompanyWebsite}
      initialMessages={chatInitialSession?.messages.map((m) =>
        aiMessageToSdkMessage(m)
      )}
    />
  );
}
