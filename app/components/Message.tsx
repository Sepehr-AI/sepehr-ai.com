"use client";

import React, { JSX, useEffect, useMemo, useState, MouseEvent } from "react";
import { SiOpenai } from "react-icons/si";
import { HiUser } from "react-icons/hi";
import { UIMessage } from "ai";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import { FaChevronDown, FaChevronUp, FaRegCopy } from "react-icons/fa6";
import { toast } from "react-toastify";
import copy from "copy-to-clipboard";
import LoadingMessage from "./LoadingMessage";

const Message = ({
  message,
  className,
  isTheLastMessage,
  waitingForFirstResp,
}: {
  message: UIMessage;
  className?: string;
  isTheLastMessage: boolean;
  waitingForFirstResp?: boolean;
}) => {
  const { role, content: text } = message;
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
              <a href={part.source.url}>{part.source.url}</a>
            </div>
          );
        } else if (part.type === "file" && part.data.trim().length) {
          console.log("File:", { part });
        } else if (part.type === "tool-invocation") {
          console.warn("Unexpected tool invocation");
          // renderedNonReasoning.push(<div key={`unknown-${index}`}></div>);
        }
      });
    }

    return { renderedReasoning, renderedNonReasoning };
  }, [isUser, message.id, message.parts]);

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
      copy(textToCopy);
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
    return <LoadingMessage />;
  }

  return (
    <div
      className={
        `mt-1 pb-3 group text-[0.920rem] mx-auto w-full text-gray-800 ${
          !isTheLastMessage && "border-b border-black/10"
        } break-words flex flex-row ${isTheLastMessage && "mb-4"}` +
        (className ? ` ${className}` : "")
      }
    >
      <div
        className={
          "flex-1" +
          (text.length < 50 && !renderedReasoning.length
            ? " content-center"
            : "")
        }
      >
        <div className="w-8 h-8 p-1.5 float-left m-2 bg-gray-700 rounded-full shrink-0 grow-0">
          {isUser ? (
            <HiUser className="text-white w-full h-full" />
          ) : (
            <SiOpenai className="text-white w-full h-full" />
          )}
        </div>
      </div>
      <div className="min-h-[10vh] flex-none flex flex-col justify-center xl:w-2xl lg:w-xl w-[85%] gap-1">
        {/* Action Block: Copy and Toggle */}
        {!isUser && (
          <div className="w-full my-2">
            <div className="relative w-full float-left ltr pl-0.5 flex flex-row gap-2 items-center">
              <button
                onClick={handleCopy}
                className="bg-gray-700 rounded p-1.5 text-white h-full"
              >
                <FaRegCopy />
              </button>

              {renderedReasoning.length > 0 && (
                <div>
                  <button
                    className="flex flex-row items-center px-1.5 outline-none text-white bg-gray-700 rounded"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowReasoning((prev) => !prev);
                    }}
                  >
                    {showReasoning ? <FaChevronDown /> : <FaChevronUp />}
                    <span className="align-middle will-change-auto opacity-100 px-2 py-1 text-sm">
                      {showReasoning ? "پنهان" : "نمایش"} استدلال
                    </span>
                  </button>
                  <div className="flex-auto"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {showReasoning && renderedReasoning.length > 0 && (
          <div className="relative z-0 whitespace-pre-wrap pl-4 pr-2 md:pl-7 md:pr-5 h-auto overflow-y-hidden will-change-auto opacity-100 rounded-2xl py-4 shadow-xl ltr text-pretty text-justify">
            <div className="flex flex-col gap-2">
              {renderedReasoning}
              <div className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-token-border-light bg-[#0000001a]"></div>
            </div>
          </div>
        )}

        {renderedNonReasoning.length > 0
          ? renderedNonReasoning
          : text?.length > 0 && (
              <p className="p-3" dir="auto">
                {text}
              </p>
            )}
      </div>
      <div className="flex-1"></div>
    </div>
  );
};

export default Message;
