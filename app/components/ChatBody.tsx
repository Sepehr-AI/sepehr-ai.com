"use client";

import Message from "./Message";
import { v7 as uuidv7 } from "uuid";
import { Model } from "@/lib/models";
import { toast } from "react-toastify";
import { updateChat } from "@/lib/chatDB";
import { handleLogout } from "@/lib/logout";
import NewMessageBox from "./NewMessageBox";
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
  // ChangeEvent,
  // useMemo,
} from "react";
import { useAttachments } from "../hooks/useAttachments";
import { readFileAsDataURL } from "../hooks/useAttachments";

const clientErrors = {
  internetIssue: {
    text: "خطا در برقراری ارتباط با سرور. لطفا اینترنت خود را چک کنید.",
    id: 1,
  },
};

// const MAX_FILE_COUNT = 5;
// const MAX_FILE_SIZE = 3 * 1024 * 1024;

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

  // const handleSubmit = (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
  //   e.preventDefault();

  //   setCustomError(null);
  //   aiHandleSubmit(e, {
  //     // experimental_attachments: files,
  //   });
  // };

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
        // toastId: clientErrors.internetIssue.id,
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
            waitingForFirstResp={waitingForFirstResp}
            isTheLastMessage={
              !waitingForFirstResp && index === messages.length - 1
            }
          />
        ))}
      </div>

      <NewMessageBox
        {...{
          input,
          status,
          isError: Boolean(
            error ||
              status === "error" ||
              customError === clientErrors.internetIssue.text
          ),
          textAreaRef,
          selectedFileNames,
          handleSubmit,
          setCustomError,
          endOfThePageRef,
          handleInputChange,
          handleFileChange,
          fileInputRef,
          handleReload,
        }}
      />
    </>
  );
}
