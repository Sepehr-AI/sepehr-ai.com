"use client";

import { useRef, useEffect, KeyboardEvent, useState } from "react";
import { Message as SdkMessage, useChat } from "@ai-sdk/react";
import { FiSend } from "react-icons/fi";
import { FaRegCircleStop } from "react-icons/fa6";
import { BsChevronDown, BsPlusLg } from "react-icons/bs";
import { RxHamburgerMenu } from "react-icons/rx";
import Message from "./Message";
import { createChat, updateChat } from "@/app/chat/lib";
import { ChatEngine, ChatProvider } from "@/lib/ai-providers";
import { v7 as uuidv7 } from "uuid";
import { Message as CiMessage, MessageRole } from "../../chat/ChatInterface";
import { useRouter } from "next/navigation";

export function useAutoResizeTextArea() {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "24px";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [textAreaRef]);

  return textAreaRef;
}

const Chat = ({
  uuid,
  engine: _engine,
  initialMessages,
}: {
  uuid?: string;
  engine?: ChatEngine;
  initialMessages?: SdkMessage[];
}) => {
  const router = useRouter();
  const [chatUuid, _] = useState(uuid || uuidv7());
  const [engine, setEngine] = useState(_engine || ChatEngine.Unknown);
  const [messageCount, setMessageCount] = useState(
    initialMessages?.length || 0
  );
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    stop,
  } = useChat({
    api: "/api/openai",
    initialMessages: initialMessages || undefined,
    // Server sent a message
    onFinish: () => setMessageCount((c) => c + 1),
  });

  const textAreaRef = useAutoResizeTextArea();
  const bottomOfChatRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea whenever the input changes
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "24px";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [input, textAreaRef]);

  useEffect(() => {
    if (messageCount === (initialMessages?.length || 0)) return;
    if (messageCount === 2 && messageCount !== initialMessages?.length) {
      router.push(`/dashboard/openai/${chatUuid}`);
    }
    if (messageCount > 1) {
      // New messages for the already created chat
      updateChat(ChatEngine.OpenAiO3Mini, chatUuid, messages);
    } else {
      // New chat
      createChat(
        ChatProvider.OpenAi,
        chatUuid,
        ChatEngine.OpenAiO3Mini,
        messages
      );
      setEngine(ChatEngine.OpenAiO3Mini);
    }
  }, [messageCount]);

  // Auto-scroll to the bottom whenever new messages arrive
  useEffect(() => {
    // User sent a new messages
    if (status === "submitted") setMessageCount((c) => c + 1);

    if (bottomOfChatRef.current) {
      bottomOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="h-full w-full flex flex-col flex-auto">
      {messages && messages.length > 0 ? (
        <div className="flex-auto flex flex-col items-center text-sm">
          <div className="flex w-full items-center justify-center gap-1 border-b border-black/10 bg-gray-50 p-3 text-gray-500 dark:border-gray-900/50 dark:bg-gray-700 dark:text-gray-300">
            مدل: {ChatEngine.toString(engine)}
          </div>
          {messages.map((message, index) => (
            <Message
              key={message.id || index}
              message={message}
              isTheLastMessage={index === messages.length - 1}
            />
          ))}
          <div ref={bottomOfChatRef}></div>
        </div>
      ) : (
        <>
          {/* <div className="flex-auto">
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
                <button
                  className="relative flex w-full cursor-default flex-col rounded-md border border-black/10 bg-white py-2 pl-3 pr-10 text-left focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-white/20 dark:bg-gray-800 sm:text-sm align-center"
                  type="button"
                >
                  <label className="block text-xs text-gray-700 dark:text-gray-500 text-center">
                    Model
                  </label>
                  <span className="inline-flex w-full truncate">
                    <span className="flex h-6 items-center gap-1 truncate text-white">
                      Vercel AI SDK
                    </span>
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <BsChevronDown className="h-4 w-4 text-gray-400" />
                  </span>
                </button>
              </div>
            </div>
          </div> */}

          {/* <div className="flex-auto"></div> */}
        </>
      )}

      <div
        className="flex-none fixed bottom-0 left-0 px-4 w-full border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <form className="my-auto" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col flex-1 items-stretch md:flex-col">
            {error && (
              <div className="mb-2 md:mb-0">
                <div className="flex ml-1 md:w-full md:m-auto md:mb-2 gap-0 md:gap-2 justify-center">
                  <span className="text-red-500 text-sm">
                    Something went wrong.
                  </span>
                </div>
              </div>
            )}
            <div className="flex flex-col py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
              <textarea
                ref={textAreaRef}
                value={input}
                tabIndex={0}
                style={{
                  height: "24px",
                  maxHeight: "200px",
                  overflowY: "hidden",
                }}
                placeholder="پیامت رو تایپ کن ..."
                className="resize-none border-0 bg-transparent pr-10 focus:ring-0 focus-visible:ring-0 dark:bg-transparent pl-2 md:pl-0"
                onChange={handleInputChange}
              ></textarea>
              {status === "submitted" || status === "streaming" ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    stop();
                  }}
                  className="absolute p-1 rounded-md bottom-1.5 md:bottom-2.5 bg-gray-500 right-1 md:right-2 disabled:opacity-40"
                >
                  <FaRegCircleStop className="h-4 w-4 text-white" />
                </button>
              ) : (
                <button
                  disabled={status !== "ready" || input?.length === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  className="absolute p-1 rounded-md bottom-1.5 md:bottom-2.5 bg-gray-500 right-1 md:right-2 disabled:opacity-40"
                >
                  <FiSend className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </form>
        <div className="px-3 py-1.5 text-center text-xs text-black/50 dark:text-white/50 md:px-4 md:pt-3 md:pb-6">
          <span>هوش مصنوعی ممکن است اطلاعات غلط نمایش دهند.</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
