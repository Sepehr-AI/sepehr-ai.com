"use client";
import { v7 as uuidv7 } from "uuid";
import { toast } from "react-toastify";
import { MdInput } from "react-icons/md";
import type { Model } from "@/lib/models";
import { createChat } from "@/lib/chatDB";
import NewMessageBox from "./NewMessageBox";
import { type Attachment, generateId } from "ai";
import CompanyLogo from "./companyLogos/CompanyLogo";
import { useState, useEffect, type SyntheticEvent } from "react";
import { readFileAsDataURL, useAttachments } from "../hooks/useAttachments";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { FiSearch } from "react-icons/fi";

export default function NewChatBody({
  router,
  models,
  textAreaRef,
}: {
  models: Model[];
  router: AppRouterInstance;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [chatUuid] = useState(uuidv7());
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [resetOnFocus, setResetOnFocus] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState(models[0]);

  const {
    fileInputRef,
    attachments: thisAttachments,
    handleFileChange,
    selectedFileNames,
    error: fileError,
    clearAttachments,
  } = useAttachments();

  useEffect(() => {
    if (fileError) {
      toast.error(fileError, { position: "top-center" });
    }
  }, [fileError]);

  const handleSubmit = async (
    e: SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) => {
    e.preventDefault();
    const val = textAreaRef.current?.value;
    if (!val?.trim()) return;

    let attachments: Attachment[] = [];
    if (thisAttachments) {
      attachments = await Promise.all(
        Array.from(thisAttachments).map(async (file) => ({
          name: file.name,
          contentType: file.type,
          url: await readFileAsDataURL(file),
        }))
      );
    }

    createChat(chatUuid, selectedEngine.code, selectedEngine.companyWebsite, [
      {
        content: "",
        role: "user",
        id: generateId(),
        parts: [{ type: "text", text: val }],
        experimental_attachments: attachments,
      },
    ]);

    router.push(`/dashboard/chat/${chatUuid}`);
    clearAttachments();
  };

  return (
    <div
      className="flex flex-col w-full h-full min-h-[80vh] md:min-h-[70vh]"
      dir="rtl"
    >
      <div className="flex flex-col items-center justify-center p-6 md:p-10 flex-grow">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center dark:text-white">
              چت جدید
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              یک مدل هوش مصنوعی را انتخاب کنید و گفتگوی خود را شروع کنید
            </p>
          </div>

          <div className="relative mb-8">
            <div className="flex items-center w-full">
              <div className="relative w-full">
                <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="جستجوی مدل..."
                  value={
                    isFocused
                      ? modelSearchTerm
                      : modelSearchTerm || selectedEngine.name
                  }
                  onChange={(e) => setModelSearchTerm(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    if (resetOnFocus) {
                      setModelSearchTerm("");
                      setResetOnFocus(false);
                    }
                    setDropdownVisible(true);
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    setDropdownVisible(false);
                    setResetOnFocus(true);
                  }}
                  className="w-full py-3 px-12 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white shadow-md"
                />
              </div>
            </div>

            {dropdownVisible && (
              <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {models
                  .filter((m) =>
                    modelSearchTerm
                      ? m.name
                          .toLowerCase()
                          .includes(modelSearchTerm.toLowerCase())
                      : true
                  )
                  .map((option) => (
                    <li
                      key={option.code}
                      onMouseDown={() => {
                        setSelectedEngine(
                          models.find((m) => m.code === option.code) ||
                            models[0]
                        );
                        setModelSearchTerm("");
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 dark:text-white"
                    >
                      <div className="flex-shrink-0 w-8 h-8">
                        <CompanyLogo companyWebsite={option.companyWebsite} />
                      </div>
                      <span className="font-medium">{option.name}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 shadow-md">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 p-2 bg-gray-50 dark:bg-gray-800 rounded-full shadow-md">
                <CompanyLogo companyWebsite={selectedEngine.companyWebsite} />
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-2 text-center dark:text-white">
              {selectedEngine.name}
            </h2>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 max-h-40 overflow-y-auto leading-relaxed text-justify">
              {selectedEngine.description}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-md">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MdInput className="text-emerald-500 dark:text-emerald-400" />
                  <span>هزینه ورودی (میلیون توکن):</span>
                </div>
                <div className="font-semibold mt-1 text-emerald-600 dark:text-emerald-400">
                  {selectedEngine.creditCostPerMilInToken.toLocaleString()}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-md">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MdInput className="text-emerald-500 dark:text-emerald-400" />
                  <span>هزینه خروجی (میلیون توکن):</span>
                </div>
                <div className="font-semibold mt-1 text-emerald-600 dark:text-emerald-400">
                  {selectedEngine.creditCostPerMilOutToken.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 shadow-md">
        <NewMessageBox
          {...{
            input,
            textAreaRef,
            fileInputRef,
            handleSubmit,
            handleFileChange,
            selectedFileNames,
            handleInputChange: (e) => setInput(e.target.value),
          }}
        />
      </div>
    </div>
  );
}
