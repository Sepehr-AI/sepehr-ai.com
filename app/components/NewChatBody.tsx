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
    <>
      <div className="flex-auto flex justify-center flex-col mx-auto my-4 max-w-[90%] md:max-w-xl lg:max-w-3xl">
        <div className="flex-1"></div>
        <div className="flex-none space-y-4 flex flex-col">
          <div className="w-full flex justify-center items-center">
            <div className="relative inline-block w-[50dvw]">
              <input
                type="text"
                placeholder="... جستجوی مدل"
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
                className="w-[inherit] mx-auto text-center rounded-md border border-gray-300 bg-white py-2 px-3 text-xl leading-6 text-gray-700 focus:outline-none"
                style={{ direction: "ltr", textAlignLast: "center" }}
              />
              {dropdownVisible && (
                <ul className="absolute z-10 mt-1 w-full max-h-70 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
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
                        className="flex flex-row space-x-2 px-4 py-2 ltr items-center arial-sans-serif cursor-pointer p-2 text-center hover:bg-blue-100"
                      >
                        <span>
                          <CompanyLogo companyWebsite={option.companyWebsite} />
                        </span>
                        <span>{option.name}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          <div className="hidden lg:flex justify-center items-center my-4 text-8xl">
            <CompanyLogo companyWebsite={selectedEngine.companyWebsite} />
          </div>
          <p className="text-justify text-gray-600 overflow-y-auto max-h-[40dvh]">
            {selectedEngine.description}
          </p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              <MdInput className="text-gray-700" />
              <span>هزینه خروجی (میلیون توکن):</span>
              <span className="text-gray-700">
                {selectedEngine.creditCostPerMilInToken.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MdInput className="text-gray-700" />
              <span>هزینه ورودی (میلیون توکن):</span>
              <span className="text-gray-700">
                {selectedEngine.creditCostPerMilOutToken.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1"></div>
        <div className="flex-1"></div>
      </div>

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
    </>
  );
}
