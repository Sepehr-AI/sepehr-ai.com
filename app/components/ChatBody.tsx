"use client";

import Message from "./Message";
import { v7 as uuidv7 } from "uuid";
import { Model } from "@/lib/models";
import { toast } from "react-toastify";
import { updateChat } from "@/lib/chatDB";
import { handleLogout } from "@/lib/logout";
import NewMessageBox from "./NewMessageBox";
import LoadingMessage from "./LoadingMessage";
import { Message as SdkMessage, useChat } from "@ai-sdk/react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  balanceNotEnoughMsg,
  UnauthorizedReason,
  unexpectedErrorMsg,
} from "@/lib/chatErrors";
import {
  useRef,
  useState,
  RefObject,
  useEffect,
  MouseEvent,
  SyntheticEvent,
} from "react";

const clientErrors = {
  internetIssue: {
    text: "خطا در برقراری ارتباط با سرور. لطفا اینترنت خود را چک کنید.",
    id: 1,
  },
};

export default function ChatBody({
  uuid,
  engine,
  router,
  textAreaRef,
  initialMessages,
}: {
  uuid?: string;
  engine: Model;
  router: AppRouterInstance;
  initialMessages?: SdkMessage[];
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [chatUuid] = useState(uuid || uuidv7());
  const [messagesCount, setMessagesCount] = useState(
    initialMessages?.length || 0
  );
  const [waitingForFirstResp, setWaitingForFirstResp] = useState(false);

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
    api: `/api/chat/${engine.code}`,
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
        return setCustomError(true);
      }

      setMessagesCount((c) => c + 1);
    },
  });

  const endOfThePageRef = useRef<HTMLDivElement>(null);
  const [customError, setCustomError] = useState<boolean>(false);
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
      updateChat(chatUuid, engine.code, messages);
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

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();

    setCustomError(false);
    aiHandleSubmit(e, {
      // experimental_attachments: files,
    });
  };

  const handleReload = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCustomError(false);
    if (textAreaRef.current) textAreaRef.current.value = "";
    try {
      reload();
    } catch (e) {
      console.warn(e);
    }
  };

  const isError = Boolean(error || customError || status === "error");
  useEffect(() => {
    if (error || customError || status === "error") {
      let errormsg: string = "";
      try {
        const parsed = JSON.parse(error?.message || "null");
        if (parsed && parsed.error && parsed.error.trim().length) {
          errormsg = parsed.error.trim();
        } else {
          errormsg = clientErrors.internetIssue.text;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        errormsg = clientErrors.internetIssue.text;
      }

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

      toast.error(errormsg, {
        position: "top-center",
        // toastId: clientErrors.internetIssue.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, customError, status]);

  return (
    <>
      <div className="flex-auto flex flex-col items-center text-sm">
        <div className="flex w-full items-center justify-center gap-1 border-b border-black/10 p-3 text-gray-500">
          مدل: {engine.code}
        </div>
        {messages.map((message, index) => (
          <Message
            message={message}
            key={message.id || index}
            isTheLastMessage={
              !waitingForFirstResp && index === messages.length - 1
            }
          />
        ))}
        {waitingForFirstResp && <LoadingMessage />}
      </div>

      <NewMessageBox
        {...{
          input,
          status,
          isError,
          textAreaRef,
          handleReload,
          handleSubmit,
          setCustomError,
          endOfThePageRef,
          handleInputChange,
        }}
      />
    </>
  );
}
