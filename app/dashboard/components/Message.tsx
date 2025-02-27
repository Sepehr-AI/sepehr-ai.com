"use client";

import React, { useState } from "react";
import { SiOpenai } from "react-icons/si";
import { HiUser } from "react-icons/hi";
import { TbCursorText } from "react-icons/tb";
import ReactMarkdown from "react-markdown";
import { UIMessage } from "ai";

const Message = ({
  message,
  isTheLastMessage,
}: {
  message: UIMessage;
  isTheLastMessage: boolean;
}) => {
  const { role, content: text, parts } = message;
  const isUser = role === "user";

  const [showReasoning, setShowReasoning] = useState(false);

  let messageContent;
  let reasoningParts: any = [];

  if (parts && Array.isArray(parts)) {
    // Separate non-reasoning and reasoning parts
    const nonReasoningParts = parts.filter((p) => p.type !== "reasoning");
    reasoningParts = parts.filter((p) => p.type === "reasoning");

    messageContent = (
      <>
        {nonReasoningParts.map((part: any, index: number) => {
          if (part.type === "text") {
            return <ReactMarkdown key={index}>{part.text}</ReactMarkdown>;
          } else if (part.type === "code") {
            return (
              <pre
                key={index}
                className="bg-gray-800 p-2 rounded my-2 overflow-auto"
              >
                <code>{part.code}</code>
              </pre>
            );
          } else if (part.type === "image") {
            return (
              <img
                key={index}
                src={part.url}
                alt={part.alt || "Image"}
                className="my-2"
              />
            );
          } else {
            return <div key={index}>{part.text || part.content}</div>;
          }
        })}
      </>
    );
  } else {
    // Fallback: render plain text (or a loading indicator if null)
    messageContent =
      !isUser && text === null ? (
        <TbCursorText className="h-6 w-6 animate-pulse" />
      ) : (
        <p style={isUser ? { color: "white" } : {}}>{text}</p>
      );
  }

  return (
    <div
      className={`group w-full text-gray-800 dark:text-gray-100 ${
        !isTheLastMessage && "border-b border-black/10"
      } dark:border-gray-900/50 bg-gray-50 dark:bg-[#444654]`}
      // ${
      //   isUser ? "dark:bg-gray-800" : "bg-gray-50 dark:bg-[#444654]"
      // }`}
    >
      <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-xl xl:max-w-3xl flex lg:px-0 m-auto w-full">
        <div className="flex flex-row gap-4 md:gap-6 md:max-w-2xl lg:max-w-xl xl:max-w-3xl p-4 md:py-6 lg:px-0 m-auto w-full">
          <div className="w-8 flex flex-col relative items-end">
            <div className="relative h-7 w-7 p-1 rounded-sm text-white flex items-center justify-center bg-black/75">
              {isUser ? (
                <HiUser className="h-4 w-4 text-white" />
              ) : (
                <SiOpenai className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="text-xs flex items-center justify-center gap-1 absolute left-0 top-2 -ml-4 -translate-x-full group-hover:visible invisible">
              <button
                disabled
                className="text-gray-300 dark:text-gray-400"
              ></button>
              <span className="flex-grow flex-shrink-0">1 / 1</span>
              <button
                disabled
                className="text-gray-300 dark:text-gray-400"
              ></button>
            </div>
          </div>
          <div className="relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-[calc(100%-115px)]">
            <div className="flex flex-grow flex-col gap-3">
              <div className="min-h-10 flex flex-col items-start gap-4 whitespace-pre-wrap break-words">
                <div className="markdown prose w-full break-words dark:prose-invert">
                  {messageContent}
                </div>
                {reasoningParts.length > 0 && (
                  <div className="mt-2">
                    {!showReasoning ? (
                      <button
                        onClick={() => setShowReasoning(true)}
                        className="text-blue-500 underline text-sm"
                      >
                        Show Reasoning
                      </button>
                    ) : (
                      <div className="mt-2 p-2 border rounded bg-gray-800">
                        {reasoningParts.map((part: any, index: number) => (
                          <ReactMarkdown key={index}>
                            {part.reasoning}
                          </ReactMarkdown>
                        ))}
                        <button
                          onClick={() => setShowReasoning(false)}
                          className="text-blue-500 underline text-sm mt-2"
                        >
                          Hide Reasoning
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
