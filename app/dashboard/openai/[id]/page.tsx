"use client";

import React, { useEffect, useState, use } from "react";
import ChatInterface, { Message } from "../../../chat/ChatInterface";
import { useRouter } from "next/navigation";
import { aiMessageToSdkMessage, ChatSession, getChat } from "../../../chat/lib";
import { ChatProvider } from "@/lib/ai-providers";
import Chat from "../../components/Chat";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const chatId = use(params).id;
  const [chatInitialSession, setChatInitialSession] =
    useState<ChatSession | null>(null);

  useEffect(() => {
    if (chatId) {
      const stored = getChat(ChatProvider.OpenAi, chatId);
      if (stored) {
        setChatInitialSession(stored);
      } else router.replace("/dashboard");
    }
  }, [chatId]);

  if (chatInitialSession === null) {
    return <div>Loading...</div>;
  }

  return (
    <Chat
      uuid={chatId}
      engine={chatInitialSession.engine}
      initialMessages={chatInitialSession?.messages.map((m) =>
        aiMessageToSdkMessage(m)
      )}
    />
  );
}
