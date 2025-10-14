"use client";

import { type LanguageModelPricingDto } from "@/lib/languageModels";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useRef } from "react";

const NewChatBody = dynamic(() => import("@/components/Chat/NewChatBody"), {
  ssr: false,
});

export function NewChatWrapper({
  models,
}: {
  models: LanguageModelPricingDto[];
}) {
  const router = useRouter();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex flex-col w-full h-full">
      <NewChatBody {...{ router, models, textAreaRef }} />
    </div>
  );
}
