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
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-800 transition-colors duration-200">
      <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto md:py-6 md:px-4">
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
    </div>
  );
}
