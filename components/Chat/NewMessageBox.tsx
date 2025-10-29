"use client";

import {
  FilePlusIcon,
  PaperPlaneIcon,
  ReloadIcon,
  StopIcon,
} from "@radix-ui/react-icons";
import type { UIMessage } from "ai";
import {
  type ChangeEvent,
  type Dispatch,
  type ElementType,
  type MouseEvent,
  type RefObject,
  type SetStateAction,
  type SyntheticEvent,
  useEffect,
} from "react";

interface NewMessageBoxProps {
  input?: string;
  stop?: () => void;
  setInput?: Dispatch<SetStateAction<string>>;
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  setCustomError?: Dispatch<SetStateAction<string | null>>;
  status?: "submitted" | "streaming" | "ready" | "error";
  handleReload?: (e: MouseEvent<HTMLButtonElement>) => void;
  handleSubmit?: (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
  handleFileChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedFileNames?: string[];
  fileInputRef?: RefObject<HTMLInputElement | null>;
  lastMessageRole?: UIMessage["role"];
}

function ActionButton({
  icon: Icon,
  className = "",
  type,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ElementType;
}) {
  return (
    <button
      type={type || "button"}
      className={`arial-sans-serif p-2 rounded-full outline-none hover:ring-2 hover:ring-accent/50 transition-colors ${className}`}
      {...props}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export default function NewMessageBox({
  status = "ready",
  stop,
  input,
  setInput,
  textAreaRef,
  handleSubmit,
  handleReload,
  fileInputRef,
  setCustomError,
  lastMessageRole,
  handleFileChange,
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
    <form dir="rtl" onSubmit={handleSubmit} className="space-y-3">
      <div className="relative flex items-end border border-border bg-background shadow-md/20 shadow-muted-foreground rounded-xl overflow-hidden">
        {/* Left actions */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1 z-10">
          {/* Hidden file input */}
          <input
            multiple
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Action button (based on state) */}
          {status === "ready" || status === "error" ? (
            lastMessageRole === "user" && !input?.trim().length ? (
              <ActionButton
                onClick={handleReload}
                icon={ReloadIcon}
                className="text-white bg-accent hover:bg-accent/90"
                aria-label="Reload"
              />
            ) : (
              <ActionButton
                type="submit"
                icon={PaperPlaneIcon}
                disabled={!input?.length}
                className={`text-white ${
                  input?.length
                    ? "bg-accent hover:bg-accent/90"
                    : "bg-accent/60 cursor-not-allowed"
                }`}
                aria-label="Send"
              />
            )
          ) : (
            <ActionButton
              onClick={() => {
                if (setCustomError) setCustomError(null);
                if (stop) stop();
              }}
              icon={StopIcon}
              className="text-white bg-destructive hover:bg-destructive/90"
              aria-label="Stop"
            />
          )}

          {/* Attachment button */}
          <ActionButton
            onClick={() => fileInputRef?.current?.click()}
            icon={FilePlusIcon}
            className="hover:bg-muted/60"
          />
        </div>

        {/* Textarea input */}
        <textarea
          tabIndex={0}
          value={input}
          ref={textAreaRef}
          style={{
            height: "24px",
            scrollbarWidth: "thin",
          }}
          onChange={(e) => (setInput ? setInput(e.target.value) : undefined)}
          placeholder="پیامت رو تایپ کن ..."
          {...(input?.valueOf().length && { dir: "auto" })}
          className="w-full py-3 px-4 pl-4 pr-[90px] max-h-[40dvh] resize-none border-0 bg-transparent focus:outline-none focus:ring-0"
        />
      </div>

      {/* Selected files list */}
      {selectedFileNames && selectedFileNames.length > 0 && (
        <div className="text-sm text-foreground/70">
          <p className="mb-1">فایل ها:</p>
          <div className="bg-muted/30 p-2 rounded border border-border">
            {selectedFileNames.map((name, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs mb-1 last:mb-0"
              >
                <FilePlusIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning message */}
      <div className="text-center text-[0.65rem] text-foreground/50">
        <span>جهت جلوگیری از بروز خطا، صحت اطلاعاتی خروجی را بررسی کنید.</span>
      </div>
    </form>
  );
}
