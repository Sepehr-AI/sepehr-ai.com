"use client";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  FilePlusIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import type { UIMessage } from "ai";
import copy from "copy-to-clipboard";
import { type JSX, type MouseEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import CompanyLogo from "../companyLogos/CompanyLogo";
import LoadingMessage, { GeneratingAnswer } from "./LoadingMessage";
import { MemoizedMarkdown } from "./MemoizedMarkdown";

/* eslint-disable @next/next/no-img-element */

const Message = ({
  message,
  className,
  aiCompanyWebsite,
  isTheLastMessage,
  stillGenerating = false,
}: {
  message: UIMessage;
  className?: string;
  aiCompanyWebsite: string;
  isTheLastMessage: boolean;
  stillGenerating?: boolean;
}) => {
  const { role } = message;
  const isUser = role === "user";

  const { renderedReasoning, renderedNonReasoning } = useMemo(() => {
    const renderedReasoning: JSX.Element[] = [];
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
        if (part.type === "reasoning" && part.text.trim().length) {
          renderedReasoning.push(
            <Markdown
              content={part.text}
              key={`reasoning-${index}`}
              className="relative h-full"
            />,
          );
        } else if (part.type === "text" && part.text.trim().length) {
          renderedNonReasoning.push(
            <Markdown content={part.text} key={`text-${index}`} />,
          );
        } else if (part.type === "source-url" && part.url.trim().length) {
          renderedNonReasoning.push(
            <div key={`source-${index}`}>
              <a href={part.url} className="text-accent hover:underline">
                {part.url}
              </a>
            </div>,
          );
        } else if (part.type === "file" && part.url.trim().length) {
          if (part.mediaType?.startsWith("image/")) {
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
                  src={_part.url || `data:${part.mediaType};base64,${part.url}`}
                  alt={_part.name || "attachment"}
                  className="max-w-full h-auto my-2 rounded-lg"
                />
              </a>,
            );
          } else {
            renderedNonReasoning.push(
              <div
                key={`file-${index}`}
                className="max-w-50 flex items-center gap-2 my-2 rounded-md border border-border bg-muted/30 p-2"
              >
                <FilePlusIcon className="h-4 w-4 flex-shrink-0" />
                <a
                  href={part.url}
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
    }

    return { renderedReasoning, renderedNonReasoning };
  }, [isUser, message.id, message.parts]);

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
      className={`group p-2 text-[0.925rem] ${!isTheLastMessage && "border-b border-border/40"} ${className || ""}`}
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
            className={`w-9 h-9 shrink-0 grow-0 rounded-full flex items-center justify-center border ${isUser ? "border-border bg-muted/50" : "border-accent/50 bg-accent/40"}`}
          >
            {isUser ? (
              <PersonIcon className="h-[70%] w-[auto]" />
            ) : (
              <CompanyLogo
                companyWebsite={aiCompanyWebsite}
                className="h-[70%] w-[auto]"
              />
            )}
          </div>

          <div className="flex flex-col justify-center">
            {/* Reasoning section */}
            {showReasoning && renderedReasoning.length > 0 && (
              <div className="mb-3 bg-muted/30 border-r-2 border-accent/30 pr-4 pl-3 py-3 rounded-md text-sm">
                <div className="rtl prose max-w-none prose-sm">
                  {renderedReasoning}
                </div>
              </div>
            )}

            {/* Main content */}
            <div
              className={`prose max-w-none ${isUser ? "prose-sm" : "prose-base"} space-y-4`}
            >
              {renderedNonReasoning.length > 0 ? renderedNonReasoning : null}
            </div>
          </div>
        </div>

        {stillGenerating && <GeneratingAnswer />}

        {/* Third (Empty/Spacer) */}
        <div style={{ height: "2dvh" }}>
          {/* This div will always match the height of the first div */}
        </div>
      </div>
    </div>
  );
};

export default Message;
