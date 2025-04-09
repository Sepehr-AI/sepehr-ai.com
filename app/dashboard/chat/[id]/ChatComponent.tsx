"use client";

import type { Model } from "@/lib/models";
import Chat from "@/app/components/Chat";
import { useRouter } from "next/navigation";
import Loading from "@/app/components/Loading";
import { aiMessageToSdkMessage } from "@/lib/vercel-ai";
import { type ChatSession, getChat } from "@/lib/chatDB";
import React, { useEffect, useState, useRef, use } from "react";

export const dynamic = "force-static";

const placeholderModels = [
  {
    code: "openai/gpt-4o-mini",
    creditCostPerMilInToken: 300,
    creditCostPerMilOutToken: 1200,
    description:
      "مدل GPT-4o-mini شرکت OpenAI، نسخه‌ای بهینه‌شده و مقرون‌به‌صرفه از خانواده مدل‌های GPT-4o است که با حفظ توانایی‌های هوش بالا، نیاز به منابع محاسباتی کمتری دارد. این مدل به گونه‌ای طراحی شده که بتواند با صرف زمان و هزینه کمتر، همچنان عملکرد دقیقی در حل مسائل پیچیده، استدلال و تولید پاسخ‌های طبیعی ارائه دهد. به عبارت دیگر، GPT-4o-mini ترکیبی از قدرت پردازشی و دقت مدل‌های بزرگ و صرفه‌جویی اقتصادی را در یک بسته نرم‌افزاری ارائه می‌دهد که آن را برای کاربردهای گسترده، از جمله پروژه‌های صنعتی و استفاده‌های روزمره، بسیار مناسب می‌سازد.",
    name: "OpenAI GPT-4o mini",
  } as Model,
];

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
      uuid={chatId as string}
      models={placeholderModels}
      engine={chatInitialSession.engine}
      initialMessages={chatInitialSession?.messages.map((m) =>
        aiMessageToSdkMessage(m)
      )}
    />
  );
}
