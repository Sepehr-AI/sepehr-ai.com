"use client";

import { useAttachments } from "@/components/Chat/hooks/useAttachments";
import { NEXT_PUBLIC_BASE_URL } from "@/lib/url";
import { type UIMessage, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { type RefObject, useRef, useState } from "react";
import { v7 as uuidv7 } from "uuid";

import CompanyLogo from "../companyLogos/CompanyLogo";
import LoadingMessage from "./LoadingMessage";
import Message from "./Message";
import NewMessageBox from "./NewMessageBox";
import { useAutoSend } from "./hooks/useAutoSend";
import {
  backendToClientErr,
  connectionFailedErrMsg,
  useErrorHandler,
} from "./hooks/useErrorHandler";
import { useInitialContext } from "./hooks/useInitialContext";
import { usePersistMessages } from "./hooks/usePersistMessages";
import { useScrollManager } from "./hooks/useScrollManager";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ChatBody({
  uuid,
  router,
  engineCode,
  textAreaRef,
  initialMessages,
  aiCompanyWebsite,
}: {
  uuid?: string;
  engineCode: string;
  aiCompanyWebsite: string;
  router: AppRouterInstance;
  initialMessages?: UIMessage[];
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [chatUuid] = useState(uuid || uuidv7());
  const [input, setInput] = useState<string>("");
  const [customError, setCustomError] = useState<string | null>(null);
  const setMessagesCount = useState(initialMessages?.length || 0)[1];

  const initialContext = useInitialContext(initialMessages),
    initialContextMessages = initialContext[0];

  const { messages, sendMessage, status, error, regenerate, stop, clearError } =
    useChat({
      experimental_throttle: 50,
      messages: initialContextMessages,
      transport: new DefaultChatTransport({
        credentials: "include",
        api: `${NEXT_PUBLIC_BASE_URL}/api/chat/${engineCode}`,
      }),
      onError: (e) => {
        setCustomError(
          backendToClientErr(
            JSON.parse((e.message || "").trim()) as any,
            router,
          ),
        );
        stop();
      },
      onFinish: ({ message }) => {
        if (!message) return;
        if (!message.parts.length) {
          return setCustomError(connectionFailedErrMsg);
        }
        setMessagesCount((c) => c + 1);
      },
    });
  const lastMessage = messages.at(-1);

  useAutoSend({
    sendMessage,
    initialContext,
    messagesLength: messages.length,
  });

  const endOfThePageRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { isAtBottom, handleScroll, scrollToMessageInput } = useScrollManager({
    messages,
    endOfThePageRef,
    messagesContainerRef,
  });

  usePersistMessages({
    status,
    chatUuid,
    messages,
    engineCode,
    initialMessages,
    aiCompanyWebsite,
    setMessagesCount,
  });

  const {
    fileInputRef,
    handleFileChange,
    selectedFileNames,
    error: fileError,
    clearAttachments,
    attachmentsToUiMessageParts,
  } = useAttachments();

  const { resetErrors } = useErrorHandler({
    error,
    router,
    customError,
    fileError,
    clearError,
    setCustomError,
  });

  return (
    <div className="flex flex-col h-full md:h-dvh relative">
      {/* Model header */}
      <div className="flex-none flex items-center justify-center p-3 border-b border-border bg-background">
        <div className="text-sm flex flex-row gap-2 arial-sans-serif items-center">
          <p className="font-medium">{engineCode}</p>
          <div className="border border-accent/50 bg-accent/40 rounded p-1">
            <CompanyLogo
              companyWebsite={aiCompanyWebsite}
              className="h-full w-auto rounded-full flex items-center justify-center"
            />
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="container mx-auto flex-1 overflow-y-auto px-4 md:px-8 bg-background scrollbar-width-thin"
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto">
          {messages.slice(0, -1).map((message, idx) => (
            <Message
              key={idx}
              isTheLastMessage={false}
              {...{
                message,
                aiCompanyWebsite,
              }}
            />
          ))}

          {lastMessage !== undefined &&
            (status !== "submitted" ? (
              <Message
                isTheLastMessage={true}
                {...{
                  aiCompanyWebsite,
                  message: lastMessage!,
                  stillGenerating: status === "streaming",
                }}
              />
            ) : (
              <>
                <Message
                  isTheLastMessage={false}
                  {...{
                    aiCompanyWebsite,
                    message: lastMessage!,
                  }}
                />
                <LoadingMessage
                  aiCompanyWebsite={aiCompanyWebsite}
                  hasAttachments={Boolean(
                    lastMessage?.parts.find((p) => p.type === "file") !==
                      undefined,
                  )}
                />
              </>
            ))}

          <div ref={endOfThePageRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && (
        <button
          className="absolute bottom-26 left-1/2 border-accent border -translate-x-1/2 bg-secondary text-secondary-foreground rounded-full p-2 hover:bg-secondary/60 transition-all z-10"
          onClick={scrollToMessageInput}
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )}

      {/* Message input */}
      <div className="pb-4 flex-none">
        <div className="max-w-5xl mx-auto">
          <NewMessageBox
            {...{
              stop,
              input,
              setInput,
              textAreaRef,
              fileInputRef,
              setCustomError,
              handleFileChange,
              selectedFileNames,
              lastMessageRole: lastMessage?.role,
              status: !customError ? status : "error",
              handleReload: (e) => {
                e.preventDefault();

                resetErrors();
                regenerate();
              },
              handleSubmit: async (e) => {
                e.preventDefault();
                if (!input.trim().length) return;

                resetErrors();
                sendMessage({
                  parts: [
                    {
                      type: "text",
                      text: input,
                    },
                    ...(await attachmentsToUiMessageParts()),
                  ],
                });

                setInput("");
                clearAttachments();
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
