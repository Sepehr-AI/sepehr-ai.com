"use client";

import { FaPaperclip, FaRegCircleStop } from "react-icons/fa6";
import { FiRefreshCw, FiSend } from "react-icons/fi";
import {
  RefObject,
  SyntheticEvent,
  MouseEvent,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  useEffect,
  DetailedHTMLProps,
  ButtonHTMLAttributes,
  ElementType,
} from "react";

interface NewMessageBoxProps {
  input?: string;
  isError?: boolean;
  endOfThePageRef?: RefObject<HTMLDivElement | null>;
  setCustomError?: Dispatch<SetStateAction<string | null>>;
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  status?: "submitted" | "streaming" | "ready" | "error";
  handleReload?: (e: MouseEvent<HTMLButtonElement>) => void;
  handleSubmit?: (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
  handleInputChange?: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleFileChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef?: RefObject<HTMLInputElement | null>;
  selectedFileNames?: string[];
}

function ActionButton({
  svg: Svg,
  ...props
}: DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & { svg: ElementType }) {
  return (
    <button
      className="flex-none p-1 rounded-md bottom-1.5 md:bottom-2.5 bg-gray-800 right-1 md:right-2 disabled:opacity-70 outline-none"
      {...props}
    >
      <Svg className="h-5 w-5 text-white" />
    </button>
  );
}

export default function NewMessageBox({
  status = "ready",
  input,
  isError,
  textAreaRef,
  handleSubmit,
  handleReload,
  setCustomError,
  endOfThePageRef,
  handleInputChange,
  handleFileChange,
  fileInputRef,
  selectedFileNames,
}: NewMessageBoxProps) {
  // Auto-resize textarea whenever the input changes
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "24px";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [input, textAreaRef]);

  return (
    <div className="flex-none py-3 lg:py-0 w-[95%] md:max-w-xl lg:max-w-3xl xl:max-w-5xl mx-auto border-t-0 md:border-transparent md:bg-vert-light-gradient bg-white md:!bg-transparent">
      <form className="my-auto" onSubmit={handleSubmit}>
        <div className="flex flex-row p-1 border border-black/10 bg-whit rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)]">
          <div className="flex-none flex flex-col ml-1">
            <div className="flex-auto"></div>
            <ActionButton
              type="button"
              onClick={() => fileInputRef?.current?.click()}
              svg={FaPaperclip}
            />
            {/* Hidden file input */}
            <input
              multiple
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="flex-none flex flex-col">
            <div className="flex-auto"></div>
            {isError ? (
              <ActionButton onClick={handleReload} svg={FiRefreshCw} />
            ) : status !== "ready" ? (
              <ActionButton
                onClick={() => {
                  if (setCustomError) setCustomError(null);
                  stop();
                }}
                svg={FaRegCircleStop}
              />
            ) : (
              <ActionButton
                type="submit"
                disabled={status !== "ready" || input?.length === 0}
                svg={FiSend}
              />
            )}
          </div>
          <textarea
            tabIndex={0}
            value={input}
            ref={textAreaRef}
            style={{
              height: "24px",
              scrollbarWidth: "none",
            }}
            onChange={handleInputChange}
            placeholder="پیامت رو تایپ کن ..."
            {...(input?.valueOf().length && { dir: "auto" })}
            className="max-h-[20dvh] overflow-y-auto flex-auto resize-none border-0 bg-transparent focus:ring-0 focus-visible:ring-0 p-1 px-3"
          />
        </div>
        {selectedFileNames && selectedFileNames.length > 0 && (
          <div className="mt-2 text-sm text-gray-600 text-right">
            <p className="inline">فایل ها: </p>
            <span className="inline-block mx-2 break-all max-w-full text-left">
              {selectedFileNames.join(", ")}
            </span>
          </div>
        )}
      </form>
      <div className="px-3 py-1.5 text-center text-xs text-black/50 md:px-4 md:pt-3 md:pb-6">
        <span>جهت جلوگیری از بروز خطا، صحت اطلاعاتی خروجی را بررسی کنید.</span>
      </div>
      <div ref={endOfThePageRef}></div>
    </div>
  );
}
