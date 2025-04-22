"use client";

import { useRef } from "react";
import type { Message } from "ai";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { LlmModelPricingDto } from "@/lib/models";

const ChatBody = dynamic(() => import("./ChatBody"), { ssr: false });
const NewChatBody = dynamic(() => import("./NewChatBody"), { ssr: false });

export default function Chat({
  uuid,
  models,
  initialMessages,
  engineCode: _engineCode,
  aiCompanyWebsite: _aiCompanyWebsite,
}: {
  uuid?: string;
  engineCode?: string;
  aiCompanyWebsite?: string;
  initialMessages?: Message[];
  models: LlmModelPricingDto[];
}) {
  const router = useRouter();
  const engineCode = _engineCode || models[0].code;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const aiCompanyWebsite = _aiCompanyWebsite || "openai.com";

  return (
    <div className="flex flex-col w-full h-full">
      {initialMessages && initialMessages.length > 0 ? (
        <ChatBody
          {...{
            uuid,
            router,
            engineCode,
            textAreaRef,
            initialMessages,
            aiCompanyWebsite,
          }}
        />
      ) : (
        <NewChatBody {...{ router, models, textAreaRef }} />
      )}
    </div>
  );
}
