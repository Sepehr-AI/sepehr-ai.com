"use client";

import { useRef, useEffect, useState, SyntheticEvent, MouseEvent } from "react";
import { Message as SdkMessage, useChat } from "@ai-sdk/react";
import { FiRefreshCw, FiSend } from "react-icons/fi";
import { FaRegCircleStop } from "react-icons/fa6";
import { BsChevronDown } from "react-icons/bs";
import Message from "./Message";
import { v7 as uuidv7 } from "uuid";
import { useRouter } from "next/navigation";
import { MdInput } from "react-icons/md";
import { Model } from "@/lib/models";
import EngineToSvg from "./EngineToSvg";
import { generateId } from "ai";
import { toast } from "react-toastify";
import {
  balanceNotEnoughMsg,
  UnauthorizedReason,
  unexpectedErrorMsg,
} from "@/lib/chatErrors";
import { handleLogout } from "@/lib/logout";
import LoadingMessage from "./LoadingMessage";
import { createChat, updateChat } from "@/lib/chatDB";

const clientErrors = {
  internetIssue: {
    text: "خطا در برقراری ارتباط با سرور. لطفا اینترنت خود را چک کنید.",
    id: 1,
  },
};

export default function Chat({
  uuid,
  engine: _engine,
  initialMessages,
  models,
}: {
  uuid?: string;
  engine?: string;
  models: Model[];
  initialMessages?: SdkMessage[];
}) {
  const router = useRouter();
  const [chatUuid] = useState(uuid || uuidv7());
  const [engine, setEngine] = useState<Model>(
    models.find((m) => m.code === _engine) || models[0]
  );
  const [messagesCount, setMessagesCount] = useState(
    initialMessages?.length || 0
  );
  const [waitingForFirstResp, setWaitingForFirstResp] = useState(false);
  // const [files, setFiles] = useState<FileList | undefined>(undefined);
  // const fileInputRef = useRef<HTMLInputElement>(null);

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
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [customError, setCustomError] = useState<boolean>(false);
  const scrollToMsgInput = () => {
    if (endOfThePageRef.current) {
      endOfThePageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  // Auto-resize textarea whenever the input changes
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "24px";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [input, textAreaRef]);

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
    if (messages.length || initialMessages?.length) {
      aiHandleSubmit(e, {
        // experimental_attachments: files,
      });

      // setFiles(undefined);
      // if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const val = textAreaRef.current?.value;
    if (!val || !val.trim().length) return;

    createChat(chatUuid, engine.code, [
      {
        content: "",
        role: "user",
        id: generateId(),
        parts: [{ type: "text", text: val }],
      },
    ]);
    router.push(`/dashboard/chat/${chatUuid}`);
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

  const isError = error || customError || status === "error";
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
    <div className="flex flex-col flex-auto w-[95%] mx-auto min-h-[100%] md:min-h-dvh">
      {messages && messages.length > 0 ? (
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
      ) : (
        <div className="flex-auto flex justify-center flex-col mx-auto my-4 md:max-w-xl lg:max-w-3xl">
          <div className="flex-1"></div>
          <div className="flex-none space-y-4">
            <div className="w-full flex justify-center items-center">
              <div className="relative inline-block">
                <select
                  id="engineSelect"
                  value={engine.code}
                  onChange={(e) =>
                    setEngine(
                      models.find((m) => m.code === e.target.value) || models[0]
                    )
                  }
                  className="block w-full text-center appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-xl leading-6 text-gray-700 placeholder-gray-4000 focus:outline-none"
                  style={{ direction: "ltr", textAlignLast: "center" }}
                >
                  {models.map((option, idx) => (
                    <option
                      key={idx}
                      value={option.code}
                      style={{ direction: "ltr", textAlignLast: "center" }}
                      className="text-center"
                    >
                      {option.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <BsChevronDown className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="hidden lg:flex justify-center items-center my-4 text-8xl">
              <EngineToSvg engine={engine.code} />
            </div>
            <p className="text-justify text-gray-600">{engine.description}</p>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <MdInput className="text-gray-700" />
                <span>مصرف اعتبار هر میلیون توکن ورودی: </span>
                <span className="text-gray-700">
                  {engine.creditCostPerMilInToken.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MdInput className="text-gray-700" />
                <span>مصرف اعتبار هر میلیون توکن خروجی: </span>
                <span className="text-gray-700">
                  {engine.creditCostPerMilOutToken.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="flex-1"></div>
        </div>
      )}

      <div className="flex-none py-3 lg:py-0 w-[95%] md:max-w-xl lg:max-w-3xl xl:max-w-5xl mx-auto border-t-0 md:border-transparent md:bg-vert-light-gradient bg-white md:!bg-transparent">
        <form className="my-auto" onSubmit={handleSubmit}>
          <div className="flex flex-row p-1 border border-black/10 bg-whit rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)]">
            <div className="flex-none content-end">
              {isError ? (
                <button
                  onClick={handleReload}
                  className="p-1 rounded-md bottom-1.5 md:bottom-2.5 bg-gray-600 right-1 md:right-2 disabled:opacity-40 outline-none"
                >
                  <FiRefreshCw className="h-5 w-5 text-white" />
                </button>
              ) : status !== "ready" ? (
                <button
                  onClick={() => {
                    setCustomError(false);
                    stop();
                  }}
                  className="p-1 rounded-md bottom-1.5 md:bottom-2.5 bg-gray-600 right-1 md:right-2 disabled:opacity-40 outline-none"
                >
                  <FaRegCircleStop className="h-5 w-5 text-white" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status !== "ready" || input?.length === 0}
                  className="p-1 rounded-md bottom-1.5 md:bottom-2.5 bg-gray-600 right-1 md:right-2 disabled:opacity-40 outline-none"
                >
                  <FiSend className="h-5 w-5 text-white" />
                </button>
              )}
            </div>
            {/* <input
                type="file"
                onChange={(event) => {
                  if (event.target.files) {
                    setFiles(event.target.files);
                  }
                }}
                multiple
                ref={fileInputRef}
              /> */}
            <textarea
              tabIndex={0}
              value={input}
              ref={textAreaRef}
              style={{
                height: "24px",
                maxHeight: "200px",
                overflowY: "hidden",
              }}
              onChange={handleInputChange}
              placeholder="پیامت رو تایپ کن ..."
              {...(input.valueOf().length && { dir: "auto" })}
              className="flex-auto resize-none border-0 bg-transparent focus:ring-0 focus-visible:ring-0 p-1 px-3"
            />
          </div>
        </form>
        <div className="px-3 py-1.5 text-center text-xs text-black/50 md:px-4 md:pt-3 md:pb-6">
          <span>
            جهت جلوگیری از بروز خطا، صحت اطلاعاتی خروجی را بررسی کنید.
          </span>
        </div>
        <div ref={endOfThePageRef}></div>
      </div>
    </div>
  );
}
