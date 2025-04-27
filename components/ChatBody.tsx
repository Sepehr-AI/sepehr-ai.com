/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import Message from "./Message";
import { v7 as uuidv7 } from "uuid";
import { toast } from "react-toastify";
import { updateChat } from "@/lib/chatDB";
import NewMessageBox from "./NewMessageBox";
import LoadingMessage from "./LoadingMessage";
import CompanyLogo from "./companyLogos/CompanyLogo";
import { useAttachments } from "@/hooks/useAttachments";
import { readFileAsDataURL } from "@/hooks/useAttachments";
import { type Message as SdkMessage, useChat } from "@ai-sdk/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  useRef,
  useState,
  useEffect,
  type RefObject,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

const NEXT_PUBLIC_BASE_URL =
  process.env.NODE_ENV === "development"
    ? ""
    : process.env.NEXT_PUBLIC_BASE_URL || "";

const clientErrors = {
  internetIssue: {
    text: "خطا در برقراری ارتباط با سرور. لطفا اینترنت خود را چک کنید.",
    id: 1,
  },
};

const backendErrorToClientError = (
  { status }: { status: number },
  router: AppRouterInstance,
): string => {
  switch (status) {
    case 416:
      return "اعتبار شما برای دریافت یک خروجی کامل از این مدل کافی نیست! اعتبار خود را افزایش دهید یا از مدل دیگری استفاده کنید.";
    case 429:
      return "تعداد درخواست همزمان غیر مجاز! لطفا کمی صبر کنید و مجددا امتحان کنید.";
    case 400:
      return "فرمت اشتباه پیام ها! در صورت تداوم با پشتیبانی ارتباط بگیرید.";
    case 404:
      return "مدل یافت نشد! احتمالا این مدل حذف شده باشد و دیگر امکان استفاده مجدد فراهم نشود.";
    case 403:
      router.push("/logout");
      return "";
    case 413:
      return "حداکثر توکن مجاز برای این مدل! چت جدیدی ایجاد کنید یا پیام خود را کوتاه‌تر کنید یا اگر فایلی آپلود کردید حجم آن را بکاهید.";
    case 402:
      router.push("/dashboard/payment?balanceInsufficient=true");
      return "اعتبار ناکافی!";
    case 401:
      return "مشکل احراز هویت! از حساب کاربری خارج شود و دوباره وارد شوید و مجدد امتحان کنید و درصورت استمرار به پشتیبانی گزارش دهید.";
    case 408:
    case 503:
      return "عدم امکان ارتباط با مدل! سرویس مدل مدنظر در دسترس نیست. در صورت استمرار این مشکل چند ساعتی صبر کنید و مجددا امتحان کنید.";
    // 500, others ...
    default:
      return "خطا در برقراری ارتباط با سرور. لطفا ارتباط اینترنت خود را بررسی کنید.";
  }
};

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
  initialMessages?: SdkMessage[];
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [chatUuid] = useState(uuid || uuidv7());
  const [isAtBottom, setIsAtBottom] = useState(true);
  const endOfThePageRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [messagesCount, setMessagesCount] = useState(
    initialMessages?.length || 0,
  );

  const {
    fileInputRef,
    attachments,
    handleFileChange,
    selectedFileNames,
    error: fileError,
    clearAttachments,
  } = useAttachments();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    status,
    error,
    reload,
    stop,
  } = useChat({
    experimental_throttle: 75,
    initialMessages: initialMessages || undefined,
    api: `${NEXT_PUBLIC_BASE_URL}/api/chat/${engineCode}`,
    onError: (e) => {
      setCustomError(
        backendErrorToClientError(JSON.parse(e.message.trim()) as any, router),
      );
      stop();
    },
    onFinish: (newMessage, { finishReason }) => {
      if (!newMessage) return;
      if (
        finishReason !== "stop" ||
        (!newMessage.content.trim().length && !newMessage.parts?.length)
      ) {
        return setCustomError(clientErrors.internetIssue.text);
      }
      setMessagesCount((c) => c + 1);
    },
  });

  useEffect(() => {
    if (fileError) {
      setCustomError(fileError);
    }
  }, [fileError, setCustomError]);

  const scrollToMsgInput = () => {
    if (endOfThePageRef.current) {
      endOfThePageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  const checkIfAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if user is at bottom (with a small threshold)
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      30;
    setIsAtBottom(atBottom);
  };

  // Setup scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkIfAtBottom);
    return () => container.removeEventListener("scroll", checkIfAtBottom);
  }, []);

  // Auto-scroll to the bottom whenever new messages arrive
  useEffect(() => {
    // User sent a new messages
    if (status === "submitted") {
      setMessagesCount((c) => c + 1);
    }
    scrollToMsgInput();
  }, [messages, status]);

  useEffect(() => {
    if (messages.length !== (initialMessages?.length || 0)) {
      updateChat(chatUuid, engineCode, aiCompanyWebsite, messages);
    }
    scrollToMsgInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesCount]);

  const [veryFirstReload, setVeryFirstReload] = useState(false);
  useEffect(() => {
    if (initialMessages && initialMessages.length) {
      if (initialMessages.length === 1) reload();
      else if (initialMessages[initialMessages.length - 1].role === "user") {
        setVeryFirstReload(true);
      }
    }

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReload = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setVeryFirstReload(false);
    setCustomError(null);
    if (textAreaRef.current) textAreaRef.current.value = "";
    try {
      reload();
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (error || customError || status === "error") {
      let errormsg: string = "";
      try {
        const parsed = JSON.parse(error?.message || "null") as any;
        if (parsed && parsed.status) {
          errormsg = backendErrorToClientError(parsed, router);
        } else {
          errormsg = customError || clientErrors.internetIssue.text;
        }
      } catch {
        errormsg = customError || clientErrors.internetIssue.text;
      }
      toast.error(errormsg, {
        position: "top-center",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, customError, status]);

  const handleSubmit = async (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    e.preventDefault();
    setCustomError(null);
    setVeryFirstReload(false);
    const attachmentsArray = attachments
      ? await Promise.all(
          Array.from(attachments).map(async (file) => {
            return {
              name: file.name,
              contentType:
                file.type && file.type.length ? file.type : "text/plain",
              url: await readFileAsDataURL(file),
            };
          }),
        )
      : undefined;
    aiHandleSubmit(e, {
      experimental_attachments: attachmentsArray,
    });
    clearAttachments();
  };

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
        onScroll={checkIfAtBottom}
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => {
            const isTheLastMessage = index === messages.length - 1;

            return status !== "submitted" ||
              !isTheLastMessage ||
              messages.length !== 1 ? (
              <Message
                key={message.id || index}
                {...{
                  message,
                  aiCompanyWebsite,
                  isTheLastMessage,
                }}
              />
            ) : (
              <div key={message.id || index}>
                <Message
                  isTheLastMessage={false}
                  {...{
                    message,
                    aiCompanyWebsite,
                  }}
                />
                <LoadingMessage
                  aiCompanyWebsite={aiCompanyWebsite}
                  hasAttachments={Boolean(
                    message.experimental_attachments?.length,
                  )}
                />
              </div>
            );
          })}
          <div ref={endOfThePageRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && (
        <button
          className="absolute bottom-26 left-1/2 border-accent border-1 -translate-x-1/2 bg-secondary text-secondary-foreground rounded-full p-2 hover:bg-secondary/60 transition-all z-10"
          onClick={scrollToMsgInput}
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
              status,
              textAreaRef,
              handleSubmit,
              handleReload,
              fileInputRef,
              setCustomError,
              handleFileChange,
              selectedFileNames,
              handleInputChange,
              isError: Boolean(
                veryFirstReload ||
                  error ||
                  status === "error" ||
                  customError === clientErrors.internetIssue.text,
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
