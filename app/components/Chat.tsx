"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import type { Model } from "@/lib/models";
import { useRouter } from "next/navigation";
import type { Message as SdkMessage } from "@ai-sdk/react";

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
  models: Model[];
  engineCode?: string;
  aiCompanyWebsite?: string;
  initialMessages?: SdkMessage[];
}) {
  const router = useRouter();
  const engineCode = _engineCode || models[0].code;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const aiCompanyWebsite = _aiCompanyWebsite || "openai.com";

  return (
    <div className="flex flex-col flex-auto w-[95%] mx-auto min-h-[100%] md:min-h-dvh">
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
