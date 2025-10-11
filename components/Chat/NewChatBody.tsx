"use client";

import { v7 as uuidv7 } from "uuid";
import { toast } from "react-toastify";
import type { LanguageModelPricingDto } from "@/lib/languageModels";
import { createChat } from "@/lib/chatDB";
import NewMessageBox from "./NewMessageBox";
import { generateId } from "ai";
import CompanyLogo from "../companyLogos/CompanyLogo";
import { useState, useEffect, type SyntheticEvent, useRef } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  CaretSortIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { useAttachments } from "./hooks/useAttachments";
import { roundToDecimals } from "@/lib/cost";

export default function NewChatBody({
  router,
  models,
  textAreaRef,
}: {
  router: AppRouterInstance;
  models: LanguageModelPricingDto[];
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [chatUuid] = useState(uuidv7());
  const [input, setInput] = useState<string>("");
  const [selectedEngine, setSelectedEngine] = useState(models[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const {
    fileInputRef,
    handleFileChange,
    selectedFileNames,
    error: fileError,
    clearAttachments,
    attachmentsToUiMessageParts,
  } = useAttachments();

  useEffect(() => {
    if (fileError) {
      toast.error(fileError, { position: "top-center" });
    }
  }, [fileError]);

  const handleEngineChange = (value: string) => {
    const engine = models.find((m) => m.code === value) || models[0];
    setSelectedEngine(engine);
  };

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    e.preventDefault();
    const val = textAreaRef.current?.value;
    if (!val?.trim()) return;

    createChat(chatUuid, selectedEngine.code, selectedEngine.companyWebsite, [
      {
        role: "user",
        id: generateId(),
        parts: [
          { type: "text", text: val },
          ...(await attachmentsToUiMessageParts()),
        ],
      },
    ]);
    router.push(`/dashboard/chat/${chatUuid}`);

    clearAttachments();
  };

  // Custom dropdown implementation with search
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSelectOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col md:h-dvh min-h-0 px-2">
      {/* Main content */}
      <div className="flex flex-col m-auto flex-auto shrink overflow-y-auto">
        <div className="flex-auto"></div>
        <div className="flex-none">
          <div
            className="max-w-xl pt-4 bg-card border border-border rounded-xl p-6 shadow-sm"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Model selector */}
            <div className="pt-2 mb-6 relative" ref={dropdownRef}>
              <button
                className="ltr text-center flex items-center justify-between w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
                onClick={() => {
                  const toggled = !isSelectOpen;
                  setIsSelectOpen(toggled);
                  if (!toggled) setSearchTerm("");
                }}
              >
                <div className="flex-auto"></div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="truncate">{selectedEngine.name}</span>
                </div>
                <div className="flex-auto"></div>
                <CaretSortIcon />
              </button>

              {isSelectOpen && (
                <div className="absolute z-50 bg-popover border border-border rounded-md shadow-md overflow-hidden min-w-full mt-1">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجوی مدل ..."
                        className="w-full p-2 pr-8 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50"
                        autoFocus
                        style={{
                          direction: !searchTerm.length ? "rtl" : "ltr",
                        }}
                      />
                      <MagnifyingGlassIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 text-foreground/50" />
                    </div>
                  </div>

                  <div className="max-h-60 p-1 overflow-y-auto scrollbar-width-thin">
                    {filteredModels.length > 0 ? (
                      filteredModels.map((model) => (
                        <button
                          key={model.code}
                          className={`ltr text-left flex items-center gap-2 p-2 w-full rounded-md text-sm outline-none hover:bg-accent/10 hover:text-accent ${
                            selectedEngine.code === model.code
                              ? "bg-accent/10 text-accent"
                              : ""
                          }`}
                          onClick={() => {
                            handleEngineChange(model.code);
                            setIsSelectOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          <CompanyLogo
                            companyWebsite={model.companyWebsite}
                            className="h-4 w-4"
                          />
                          <span>{model.name}</span>
                          {selectedEngine.code === model.code && (
                            <CheckIcon className="ml-auto" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-foreground/70 text-center">
                        مدلی یافت نشد
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Model details */}
            <div className="grid gap-6 items-start">
              <div className="flex flex-col items-center justify-center">
                <div className="w-24 h-24 flex items-center justify-center mb-4">
                  <CompanyLogo
                    companyWebsite={selectedEngine.companyWebsite}
                    className="w-full h-full"
                  />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-foreground/90">
                      مصرف تقریبی{" "}
                      {roundToDecimals(
                        selectedEngine.milInCreditCost / 1000,
                        1,
                      )}{" "}
                      اعتبار هر هزار کلمه ارسالی به مدل
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-foreground/90">
                      مصرف تقریبی{" "}
                      {roundToDecimals(
                        selectedEngine.milOutCreditCost / 1000,
                        1,
                      )}{" "}
                      اعتبار هر هزار کلمه دریافتی از مدل
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">درباره این مدل</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {selectedEngine.description}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-auto"></div>
      </div>

      {/* Message input */}
      <div className="pb-4 flex-none">
        <div className="max-w-5xl mx-auto">
          <NewMessageBox
            {...{
              input,
              setInput,
              textAreaRef,
              fileInputRef,
              handleSubmit,
              handleFileChange,
              selectedFileNames,
            }}
          />
        </div>
      </div>
    </div>
  );
}
