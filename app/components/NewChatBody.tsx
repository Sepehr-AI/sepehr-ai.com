"use client";

import { generateId } from "ai";
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
  RefObject,
  SetStateAction,
  SyntheticEvent,
} from "react";

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
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [chatUuid] = useState(uuidv7());
  const [resetOnFocus, setResetOnFocus] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();

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

  return (
    <>
      <div className="flex-auto flex justify-center flex-col mx-auto my-4 md:max-w-xl lg:max-w-3xl">
        <div className="flex-1"></div>
        <div className="flex-none space-y-4">
          <div className="w-full flex justify-center items-center">
            <div className="relative inline-block w-full">
              <input
                type="text"
                placeholder="جستجو مدل..."
                value={modelSearchTerm || engine.name}
                onChange={(e) => setModelSearchTerm(e.target.value)}
                onFocus={() => {
                  if (resetOnFocus) {
                    setModelSearchTerm("");
                    setResetOnFocus(false);
                  }
                  setDropdownVisible(true);
                }}
                onBlur={() => {
                  setDropdownVisible(false);
                  setResetOnFocus(true);
                }}
                className="block w-full text-center rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-xl leading-6 text-gray-700 focus:outline-none"
                style={{ direction: "ltr", textAlignLast: "center" }}
              />
              {dropdownVisible && (
                <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
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
                        {option.name} ({option.code})
                      </li>
                    ))}
                </ul>
              )}
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

      <NewMessageBox {...{ handleSubmit, textAreaRef }} />
    </>
  );
}
