"use client";
import { FiRefreshCw, FiSend, FiPaperclip } from "react-icons/fi";
import { FaRegCircleStop } from "react-icons/fa6";
import {
  useEffect,
  type Dispatch,
  type RefObject,
  type MouseEvent,
  type ChangeEvent,
  type ElementType,
  type SyntheticEvent,
  type SetStateAction,
  type DetailedHTMLProps,
  type ButtonHTMLAttributes,
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
      className="flex-none p-2 rounded-full text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors shadow-md"
      {...props}
    >
      <Svg className="h-5 w-5" />
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
    <div
      className="p-4 bg-white dark:bg-gray-800 transition-colors duration-200"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-3">
            <ActionButton
              type={isError ? "button" : "submit"}
              disabled={!isError && (status !== "ready" || !input?.length)}
              svg={
                isError
                  ? FiRefreshCw
                  : status !== "ready"
                  ? FaRegCircleStop
                  : FiSend
              }
              onClick={
                isError
                  ? handleReload
                  : status !== "ready"
                  ? () => {
                      if (setCustomError) setCustomError(null);
                      stop();
                    }
                  : undefined
              }
            />

            <div className="relative flex-grow bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-emerald-300 dark:focus-within:border-emerald-700 focus-within:ring-1 focus-within:ring-emerald-300 dark:focus-within:ring-emerald-700 transition-all shadow-sm">
              <textarea
                tabIndex={0}
                value={input}
                ref={textAreaRef}
                onChange={handleInputChange}
                placeholder="پیامت رو تایپ کن ..."
                style={{
                  height: "24px",
                  minHeight: "56px",
                  maxHeight: "200px",
                  scrollbarWidth: "none",
                }}
                className="w-full resize-none bg-transparent border-0 focus:ring-0 focus-visible:ring-0 py-3 px-4 dark:text-white"
                {...(input?.valueOf().length && { dir: "auto" })}
              />

              <button
                type="button"
                onClick={() => fileInputRef?.current?.click()}
                className="absolute bottom-2 right-3 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              >
                <FiPaperclip className="w-5 h-5" />
              </button>

              <input
                multiple
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {selectedFileNames && selectedFileNames.length > 0 && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1 mb-1">
                <FiPaperclip className="text-emerald-500 dark:text-emerald-400" />
                <span>فایل‌های انتخاب شده:</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-700 dark:text-gray-300 break-all max-h-20 overflow-y-auto shadow-sm">
                {selectedFileNames.join(", ")}
              </div>
            </div>
          )}
        </form>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
          جهت جلوگیری از بروز خطا، صحت اطلاعاتی خروجی را بررسی کنید.
        </div>

        <div ref={endOfThePageRef}></div>
      </div>
    </div>
  );
}
