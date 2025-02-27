"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SiOpenai } from "react-icons/si";
import { ChatSession, updateChat } from "./lib";
import { ChatProvider } from "@/lib/ai-providers";
import { useChat } from "@ai-sdk/react";
import { useRef } from "react";
import Image from "next/image";

export enum MessageRole {
  User = 0,
  Ai = 1,
}

export enum MessageType {
  Text = 0,
  Image = 1,
  Document = 2,
}

export type Message = {
  text: string;
  type: MessageType;
  role: MessageRole;
};

type ChatInterfaceProps = {
  chatId: string;
  disabled: boolean;
  messages: ChatSession;
  provider: ChatProvider;
  onNewChat?: (messages: Message[]) => void;
};

export default function Chat(props: ChatInterfaceProps) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/openai",
  });

  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((m) => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === "user" ? "User: " : "AI: "}
          {m.content}
          <div>
            {m?.experimental_attachments
              ?.filter((attachment) =>
                attachment?.contentType?.startsWith("image/")
              )
              .map((attachment, index) => (
                <Image
                  key={`${m.id}-${index}`}
                  src={attachment.url}
                  width={500}
                  height={500}
                  alt={attachment.name ?? `attachment-${index}`}
                />
              ))}
          </div>
        </div>
      ))}

      <form
        className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl space-y-2"
        onSubmit={(event) => {
          handleSubmit(event, {
            experimental_attachments: files,
          });

          setFiles(undefined);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      >
        <input
          type="file"
          className=""
          onChange={(event) => {
            if (event.target.files) {
              setFiles(event.target.files);
            }
          }}
          multiple
          ref={fileInputRef}
        />
        <input
          className="w-full p-2"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
