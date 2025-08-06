"use client";

import dynamic from "next/dynamic";
import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { type LlmModelPricingDto } from "@/lib/models";

const NewChatBody = dynamic(() => import("@/components/Chat/NewChatBody"), {
  ssr: false,
});

export function NewChatWrapper({ models }: { models: LlmModelPricingDto[] }) {
  const router = useRouter();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex flex-col w-full h-full">
      <NewChatBody {...{ router, models, textAreaRef }} />
    </div>
  );
}
