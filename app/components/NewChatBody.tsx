"use client";

import { Attachment, generateId } from "ai";
import { v7 as uuidv7 } from "uuid";
import { Model } from "@/lib/models";
import EngineToSvg from "./EngineToSvg";
import { MdInput } from "react-icons/md";
import { createChat } from "@/lib/chatDB";
import NewMessageBox from "./NewMessageBox";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  Dispatch,
  useState,
  SetStateAction,
  SyntheticEvent,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import { readFileAsDataURL, useAttachments } from "../hooks/useAttachments";

export default function NewChatBody({
  router,
  engine,
  models,
  setEngine,
  textAreaRef,
}: {
  engine: Model;
  models: Model[];
  router: AppRouterInstance;
  setEngine: Dispatch<SetStateAction<Model>>;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [chatUuid] = useState(uuidv7());
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [resetOnFocus, setResetOnFocus] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
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

    createChat(chatUuid, engine.code, [
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
            <div className="relative inline-block">
              <input
                type="text"
                placeholder="... جستجوی مدل"
                value={
                  isFocused ? modelSearchTerm : modelSearchTerm || engine.name
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
                className="mx-auto text-center rounded-md border border-gray-300 bg-white py-2 px-3 text-xl leading-6 text-gray-700 focus:outline-none"
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
                          setEngine(option);
                          setModelSearchTerm("");
                        }}
                        className="cursor-pointer p-2 text-center hover:bg-blue-100"
                      >
                        {option.name}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          <div className="hidden lg:flex justify-center items-center my-4 text-8xl">
            <EngineToSvg engine={engine.code} />
          </div>
          <p className="text-justify text-gray-600 overflow-y-auto max-h-[40dvh]">
            {engine.description}
          </p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              <MdInput className="text-gray-700" />
              <span>هزینه خروجی (میلیون توکن):</span>
              <span className="text-gray-700">
                {engine.creditCostPerMilInToken.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MdInput className="text-gray-700" />
              <span>هزینه ورودی (میلیون توکن):</span>
              <span className="text-gray-700">
                {engine.creditCostPerMilOutToken.toLocaleString()}
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
          handleSubmit,
          textAreaRef,
          handleInputChange: (e) => setInput(e.target.value),
          handleFileChange,
          fileInputRef,
          selectedFileNames,
        }}
      />
    </>
  );
}
