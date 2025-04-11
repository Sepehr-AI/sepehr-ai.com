"use client";
import Message from "./Message";
import { v7 as uuidv7 } from "uuid";
import { toast } from "react-toastify";
import { updateChat } from "@/lib/chatDB";
import { handleLogout } from "@/lib/logout";
import NewMessageBox from "./NewMessageBox";
import { useAttachments } from "../hooks/useAttachments";
import { readFileAsDataURL } from "../hooks/useAttachments";
import { type Message as SdkMessage, useChat } from "@ai-sdk/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  balanceNotEnoughMsg,
  UnauthorizedReason,
  unexpectedErrorMsg,
} from "@/lib/chatErrors";
import {
  useRef,
  useState,
  useEffect,
  type RefObject,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

const clientErrors = {
  internetIssue: {
    text: "خطا در برقراری ارتباط با سرور. لطفا اینترنت خود را چک کنید.",
    id: 1,
  },
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
  const [waitingForFirstResp, setWaitingForFirstResp] = useState(false);
  const [messagesCount, setMessagesCount] = useState(
    initialMessages?.length || 0
  );

  const {
    fileInputRef,
    attachments,
    handleFileChange,
    selectedFileNames,
    error: fileError,
    clearAttachments,
  } = useAttachments();

  const [customError, setCustomError] = useState<string | null>(null);

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
    api: `/api/chat/${engineCode}`,
    initialMessages: initialMessages || undefined,
    onError: () => {
      setWaitingForFirstResp(false);
      stop();
    },
    onFinish: (newMessage, { finishReason }) => {
      setWaitingForFirstResp(false);
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

  const endOfThePageRef = useRef<HTMLDivElement>(null);

  const scrollToMsgInput = () => {
    if (endOfThePageRef.current) {
      endOfThePageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  // Auto-scroll to the bottom whenever new messages arrive
  useEffect(() => {
    // User sent a new messages
    if (status === "submitted") {
      setWaitingForFirstResp(true);
      setMessagesCount((c) => c + 1);
    }
    if (status === "streaming") setWaitingForFirstResp(false);
    scrollToMsgInput();
  }, [messages, status]);

  useEffect(() => {
    if (messages.length !== (initialMessages?.length || 0)) {
      updateChat(chatUuid, engineCode, aiCompanyWebsite, messages);
    }
    scrollToMsgInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesCount]);

  useEffect(() => {
    if (initialMessages?.length === 1) reload();
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReload = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
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
        const parsed = JSON.parse(error?.message || "null");
        if (parsed && parsed.error && parsed.error.trim().length) {
          errormsg = parsed.error.trim();
          switch (errormsg) {
            case balanceNotEnoughMsg:
              return router.push("/dashboard/payment?balanceInsufficient=true");
            case UnauthorizedReason.UNAUTH:
            case UnauthorizedReason.JWT_NOT_VALID:
            case UnauthorizedReason.USER_NOT_FOUND:
            case UnauthorizedReason.COOKIE_NOT_SET:
              handleLogout(router);
              return;
            case unexpectedErrorMsg:
              errormsg = "خطای داخلی! در صورت تداوم با پشتیبانی ارتباط بگیرید.";
              break;
            default:
              errormsg =
                "خطا در برقراری ارتباط با سرور. لطفا ارتباط اینترنت خود را بررسی کنید.";
              break;
          }
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
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) => {
    e.preventDefault();
    setCustomError(null);
    const attachmentsArray = attachments
      ? await Promise.all(
          Array.from(attachments).map(async (file) => ({
            name: file.name,
            contentType: file.type,
            url: await readFileAsDataURL(file),
          }))
        )
      : undefined;
    aiHandleSubmit(e, {
      experimental_attachments: attachmentsArray,
    });
    clearAttachments();
  };

  // Calculate if we need minimal height or scrolling
  const messagesContainerClass =
    messages.length < 3
      ? "flex-grow min-h-[50vh] md:min-h-[60vh]"
      : "flex-1 overflow-y-auto";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 md:rounded-xl shadow-md overflow-hidden transition-colors duration-200">
      <div className="flex items-center justify-center py-3 px-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <span>مدل:</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {engineCode}
          </span>
        </div>
      </div>

      <div className={messagesContainerClass} dir="rtl">
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <Message
              message={message}
              key={message.id || index}
              aiCompanyWebsite={aiCompanyWebsite}
              waitingForFirstResp={waitingForFirstResp}
              isTheLastMessage={
                !waitingForFirstResp && index === messages.length - 1
              }
            />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 shadow-md">
        <NewMessageBox
          {...{
            input,
            status,
            textAreaRef,
            handleSubmit,
            handleReload,
            fileInputRef,
            setCustomError,
            endOfThePageRef,
            handleFileChange,
            selectedFileNames,
            handleInputChange,
            isError: Boolean(
              error ||
                status === "error" ||
                customError === clientErrors.internetIssue.text
            ),
          }}
        />
      </div>
    </div>
  );
}
