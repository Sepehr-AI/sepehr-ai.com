"use client";

import { useRef, useState } from "react";
import { Model } from "@/lib/models";
import dynamic from "next/dynamic";
import { Message as SdkMessage } from "@ai-sdk/react";
import { useRouter } from "next/navigation";

const ChatBody = dynamic(() => import("./ChatBody"), { ssr: false });
const NewChatBody = dynamic(() => import("./NewChatBody"), { ssr: false });

export default function Chat({
  uuid,
  engine: _engine,
  initialMessages,
  models,
}: {
  uuid?: string;
  engine?: string;
  models: Model[];
  initialMessages?: SdkMessage[];
}) {
  const router = useRouter();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [engine, setEngine] = useState<Model>(
    models.find((m) => m.code === _engine) || models[0]
  );

  return (
    <div className="flex flex-col flex-auto w-[95%] mx-auto min-h-[100%] md:min-h-dvh">
      {initialMessages && initialMessages.length > 0 ? (
        <ChatBody {...{ uuid, router, engine, textAreaRef, initialMessages }} />
      ) : (
        <NewChatBody {...{ router, engine, models, setEngine, textAreaRef }} />
      )}
    </div>
  );
}
