/* eslint-disable @next/next/no-img-element */

"use client";

import type { UIMessage } from "ai";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";
import LoadingMessage from "./LoadingMessage";
import CompanyLogo from "./companyLogos/CompanyLogo";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import { useState, useMemo, type JSX, useEffect, type MouseEvent } from "react";
import {
  CopyIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FilePlusIcon,
  PersonIcon,
} from "@radix-ui/react-icons";

const Message = ({
  message,
  className,
  aiCompanyWebsite,
  isTheLastMessage,
}: {
  message: UIMessage;
  className?: string;
  aiCompanyWebsite: string;
  isTheLastMessage: boolean;
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
          <p className="whitespace-pre-wrap" dir="auto">
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
                className="relative h-full"
              />,
            );
          } else if (part.type === "text" && part.text.trim().length) {
            renderedNonReasoning.push(
              <Markdown content={part.text} key={`text-${index}`} />,
            );
          } else if (part.type === "source" && part.source.url.trim().length) {
            renderedNonReasoning.push(
              <div key={`source-${index}`}>
                <a
                  href={part.source.url}
                  className="text-accent hover:underline"
                >
                  {part.source.url}
                </a>
              </div>,
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
                    className="max-w-full h-auto my-2 rounded-lg"
                  />
                </a>,
              );
            } else {
              renderedNonReasoning.push(
                <div
                  key={`file-${index}`}
                  className="flex items-center gap-2 my-2 rounded-md border border-border bg-muted/30 p-2"
                >
                  <FilePlusIcon className="h-4 w-4 flex-shrink-0" />
                  <a
                    href={part.data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline text-sm"
                  >
                    دانلود فایل
                  </a>
                </div>,
              );
            }
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
                    className="max-w-full h-auto my-2 mx-auto rounded-lg"
                  />
                </a>,
              );
            } else {
              renderedAttachments.push(
                <div
                  key={`attachment-${index}`}
                  className="flex items-center gap-2 my-2 rounded-md border border-border bg-muted/30 p-2"
                >
                  <FilePlusIcon className="h-4 w-4 flex-shrink-0" />
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.name || "download"}
                    className="text-accent hover:underline text-sm"
                  >
                    {attachment.name || "دانلود فایل"}
                  </a>
                </div>,
              );
            }
          });
        }
      }

      return { renderedReasoning, renderedNonReasoning, renderedAttachments };
    }, [isUser, message.experimental_attachments, message.id, message.parts]);

  // Control the visibility of reasoning parts based on non-reasoning parts
  const [showReasoning, setShowReasoning] = useState(
    !renderedNonReasoning.length,
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
    !renderedReasoning.length &&
    !renderedNonReasoning.length
  ) {
    return <LoadingMessage aiCompanyWebsite={aiCompanyWebsite} />;
  }

  return (
    <div
      className={`group px-1 py-1 text-[0.925rem] ${!isTheLastMessage && "border-b border-border/40"} ${className || ""}`}
    >
      {/* Message content */}
      <div className="grid grid-rows-[auto,1fr,auto] gap-2 h-full min-w-0 w-full">
        {/* First (Toolbar) */}
        <div
          className="ltr w-full flex items-center gap-2 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity"
          style={{ height: "2dvh" }}
        >
          {!isUser && renderedReasoning.length > 0 ? (
            <button
              className="inline-flex items-center text-xs gap-1 py-1 px-2 rounded bg-muted hover:bg-muted/70 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                setShowReasoning((prev) => !prev);
              }}
            >
              {showReasoning ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronUpIcon className="h-3 w-3" />
              )}
              <span>{showReasoning ? "پنهان" : "نمایش"} استدلال</span>
            </button>
          ) : (
            <div className="inline-flex items-center"></div>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center text-xs gap-1 py-1 px-2 rounded bg-muted hover:bg-muted/70 transition-colors"
          >
            <CopyIcon className="h-3 w-3" />
            <span>کپی</span>
          </button>
        </div>

        {/* Middle (Content) */}
        <div className="overflow-x-auto overflow-y-hidden flex flex-row gap-4">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center border ${isUser ? "border-border bg-muted/50" : "border-accent/50 bg-accent/40"}`}
          >
            {isUser ? (
              <PersonIcon className="h-5 w-5" />
            ) : (
              <CompanyLogo
                companyWebsite={aiCompanyWebsite}
                className="h-5 w-5"
              />
            )}
          </div>

          <div className="flex items-center">
            {/* Reasoning section */}
            {showReasoning && renderedReasoning.length > 0 && (
              <div className="mb-3 relative bg-muted/30 border-r-2 border-accent/30 pr-4 pl-3 py-3 rounded-md text-sm">
                <div className="prose max-w-none prose-sm">
                  {renderedReasoning}
                </div>
              </div>
            )}

            {/* Main content */}
            <div
              className={`prose max-w-none ${isUser ? "prose-sm" : "prose-base"} space-y-4`}
            >
              {renderedNonReasoning.length > 0
                ? renderedNonReasoning
                : text?.length > 0 && (
                    <p className="whitespace-pre-wrap" dir="auto">
                      {text}
                    </p>
                  )}
            </div>

            {/* Attachments */}
            {renderedAttachments && renderedAttachments.length > 0 && (
              <div className="mt-3 space-y-2">{renderedAttachments}</div>
            )}
          </div>
        </div>

        {/* Third (Empty/Spacer) */}
        <div style={{ height: "2dvh" }}>
          {/* This div will always match the height of the first div */}
        </div>
      </div>
    </div>
  );
};

export default Message;
