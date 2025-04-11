/* eslint-disable @next/next/no-img-element */
"use client";
import type { UIMessage } from "ai";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";
import { HiUser } from "react-icons/hi";
import LoadingMessage from "./LoadingMessage";
import CompanyLogo from "./companyLogos/CompanyLogo";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import {
  FiChevronDown,
  FiChevronUp,
  FiPaperclip,
  FiCopy,
} from "react-icons/fi";
import React, {
  useMemo,
  useState,
  type JSX,
  useEffect,
  type MouseEvent,
} from "react";

const Message = ({
  message,
  className,
  aiCompanyWebsite,
  isTheLastMessage,
  waitingForFirstResp,
}: {
  message: UIMessage;
  className?: string;
  aiCompanyWebsite: string;
  isTheLastMessage: boolean;
  waitingForFirstResp?: boolean;
}) => {
  const { role, content: text } = message;
  const isUser = role === "user";

  const { renderedReasoning, renderedNonReasoning, renderedAttachments } =
    useMemo(() => {
      const renderedReasoning: JSX.Element[] = [];
      const renderedAttachments: JSX.Element[] = [];
      const renderedNonReasoning: JSX.Element[] = [];

      const Markdown = ({
        content,
        className,
      }: {
        content: string;
        className?: string;
      }) =>
        !isUser ? (
          <MemoizedMarkdown
            id={message.id}
            content={content}
            className={className}
          />
        ) : (
          <p className="p-3" dir="auto">
            {content}
          </p>
        );

      if (Array.isArray(message.parts)) {
        message.parts.forEach((part, index) => {
          if (part.type === "reasoning" && part.reasoning.trim().length) {
            renderedReasoning.push(
              <Markdown
                content={part.reasoning}
                key={`reasoning-${index}`}
                className="relative flex h-full flex-col"
              />
            );
          } else if (part.type === "text" && part.text.trim().length) {
            renderedNonReasoning.push(
              <Markdown
                className="p-1"
                content={part.text}
                key={`text-${index}`}
              />
            );
          } else if (part.type === "source" && part.source.url.trim().length) {
            renderedNonReasoning.push(
              <div key={`source-${index}`}>
                <a
                  href={part.source.url}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {part.source.url}
                </a>
              </div>
            );
          } else if (part.type === "file" && part.data.trim().length) {
            if (part.mimeType && part.mimeType.startsWith("image/")) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const _part = part as any;
              renderedNonReasoning.push(
                <a
                  target="_blank"
                  href={_part.url}
                  key={`file-${index}`}
                  rel="noopener noreferrer"
                  download={_part.name || "download"}
                  className="block hover:cursor-pointer"
                >
                  <img
                    key={`file-${index}`}
                    src={
                      _part.url || `data:${part.mimeType};base64,${part.data}`
                    }
                    alt={_part.name || "attachment"}
                    className="max-w-full h-auto my-2 rounded-lg shadow-md"
                  />
                </a>
              );
            } else {
              renderedNonReasoning.push(
                <div
                  key={`file-${index}`}
                  className="flex items-center gap-2 my-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm"
                >
                  <FiPaperclip className="text-emerald-500 dark:text-emerald-400" />
                  <a
                    href={part.data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    دانلود فایل
                  </a>
                </div>
              );
            }
          } else if (part.type === "tool-invocation") {
            console.warn("Unexpected tool invocation");
          }
        });

        if (
          message.experimental_attachments &&
          message.experimental_attachments.length
        ) {
          message.experimental_attachments.forEach((attachment, index) => {
            if (
              attachment.contentType &&
              attachment.contentType.startsWith("image/")
            ) {
              renderedAttachments.push(
                <a
                  target="_blank"
                  href={attachment.url}
                  rel="noopener noreferrer"
                  key={`attachment-${index}`}
                  download={attachment.name || "download"}
                  className="block hover:cursor-pointer"
                >
                  <img
                    src={attachment.url}
                    alt={attachment.name || "attachment"}
                    className="max-w-full h-auto my-2 mx-auto rounded-lg border border-gray-100 dark:border-gray-700 shadow-md"
                  />
                </a>
              );
            } else {
              renderedAttachments.push(
                <div
                  key={`attachment-${index}`}
                  className="flex items-center gap-2 my-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  <FiPaperclip className="text-emerald-500 dark:text-emerald-400" />
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.name || "download"}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {attachment.name || "دانلود فایل"}
                  </a>
                </div>
              );
            }
          });
        }
      }

      return { renderedReasoning, renderedNonReasoning, renderedAttachments };
    }, [isUser, message.experimental_attachments, message.id, message.parts]);

  // Control the visibility of reasoning parts based on non-reasoning parts
  const [showReasoning, setShowReasoning] = useState(
    !renderedNonReasoning.length
  );

  useEffect(() => {
    if (renderedNonReasoning.length && showReasoning) {
      setShowReasoning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderedNonReasoning]);

  const handleCopy = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let textToCopy = "";
    if (renderedReasoning.length && showReasoning) {
      textToCopy = renderedReasoning
        .map((el) => {
          // Assuming Markdown components have a "content" prop
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (el.props as any).content;
        })
        .join("\n");
    }
    if (renderedNonReasoning.length) {
      textToCopy +=
        "\n\n" +
        renderedNonReasoning
          .map((el) => {
            // Assuming Markdown components have a "content" prop
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (el.props as any).content;
          })
          .join("\n");
    }
    try {
      copy(textToCopy.trim());
      toast.success("پیام در کلیپ‌بورد کپی شد.", {
        position: "top-center",
        toastId: `clipboard-msg-${message.id}`,
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (
    isTheLastMessage &&
    (waitingForFirstResp ||
      (!renderedReasoning.length && !renderedNonReasoning.length))
  ) {
    return <LoadingMessage aiCompanyWebsite={aiCompanyWebsite} />;
  }

  return (
    <div
      className={`py-6 ${isUser ? "" : "bg-gray-50 dark:bg-gray-700/30"} px-4 ${
        !isTheLastMessage ? "border-b border-gray-100 dark:border-gray-700" : ""
      } transition-colors duration-200`}
    >
      <div className="flex gap-4 max-w-3xl mx-auto">
        <div className="flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md
            ${
              isUser
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
            }`}
          >
            {isUser ? (
              <HiUser className="w-5 h-5" />
            ) : (
              <CompanyLogo
                className="w-7 h-7"
                companyWebsite={aiCompanyWebsite}
              />
            )}
          </div>
        </div>

        <div className="flex-grow">
          {/* Action Block: Copy and Toggle */}
          {!isUser && (
            <div className="flex justify-end mb-2">
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors shadow-sm"
                  aria-label="Copy message"
                >
                  <FiCopy size={16} />
                </button>

                {renderedReasoning.length > 0 && (
                  <button
                    className="flex items-center gap-1 px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors shadow-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowReasoning((prev) => !prev);
                    }}
                  >
                    {showReasoning ? (
                      <FiChevronUp size={16} />
                    ) : (
                      <FiChevronDown size={16} />
                    )}
                    <span className="text-sm">
                      {showReasoning ? "پنهان" : "نمایش"} استدلال
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Message Content */}
          <div
            className={`prose dark:prose-invert max-w-none ${
              isUser
                ? "text-gray-800 dark:text-gray-200"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            {showReasoning && renderedReasoning.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 border-r-4 border-emerald-500 dark:border-emerald-400 rounded-r-md rounded-l my-3 shadow-md">
                {renderedReasoning}
              </div>
            )}

            <div>
              {renderedNonReasoning.length > 0
                ? renderedNonReasoning
                : text?.length > 0 && <p dir="auto">{text}</p>}
            </div>

            {renderedAttachments && renderedAttachments.length > 0 && (
              <div className="mt-4 space-y-2">{renderedAttachments}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
