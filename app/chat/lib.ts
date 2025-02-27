"use client";

import { ChatEngine, ChatProvider } from "@/lib/ai-providers";
import { Attachment, JSONValue, Message, ToolInvocation, UIMessage } from "ai";

type LanguageModelV1ProviderMetadata = Record<
  string,
  Record<string, JSONValue>
>;

type LanguageModelV1Source = {
  /**
   * A URL source. This is return by web search RAG models.
   */
  sourceType: "url";
  /**
   * The ID of the source.
   */
  id: string;
  /**
   * The URL of the source.
   */
  url: string;
  /**
   * The title of the source.
   */
  title?: string;
  /**
   * Additional provider metadata for the source.
   */
  providerMetadata?: LanguageModelV1ProviderMetadata;
};

/**
 * A text part of a message.
 */
type TextUIPart = {
  type: "text";
  /**
   * The text content.
   */
  text: string;
};
/**
 * A reasoning part of a message.
 */
type ReasoningUIPart = {
  type: "reasoning";
  /**
   * The reasoning text.
   */
  reasoning: string;
};
/**
 * A tool invocation part of a message.
 */
type ToolInvocationUIPart = {
  type: "tool-invocation";
  /**
   * The tool invocation.
   */
  toolInvocation: ToolInvocation;
};
/**
 * A source part of a message.
 */
type SourceUIPart = {
  type: "source";
  /**
   * The source.
   */
  source: LanguageModelV1Source;
};

/**
 * AI SDK UI Messages. They are used in the client and to communicate between the frontend and the API routes.
 */
interface AiMessage {
  /**
  A unique identifier for the message.
     */
  id: string;
  /**
  The timestamp of the message.
     */
  createdAt?: Date;
  /**
   * Additional attachments to be sent along with the message.
   */
  experimental_attachments?: Attachment[];
  /**
  The 'data' role is deprecated.
     */
  role: "system" | "user" | "assistant" /* | "data" */;
  /**
   * Additional message-specific information added on the server via StreamData
   */
  annotations?: JSONValue[] | undefined;
  /**
   * The parts of the message. Use this for rendering the message in the UI.
   *
   * Assistant messages can have text, reasoning and tool invocation parts.
   * User messages can have text parts.
   */
  parts: Array<
    TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart
  >;
}

export function sdkMessageToAiMessage(msg: Message | UIMessage): AiMessage {
  if (!msg.parts) {
    console.error("Invalid message.", msg);
    throw new Error(
      "Invalid message passed to sdkMessageToAiMessage. Check the console for more information."
    );
  }

  return {
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    createdAt: msg.createdAt,
    annotations: msg.annotations,
    experimental_attachments: msg.experimental_attachments,
  } as AiMessage;
}

export function mapMessagePartsToContent(msg: Message[]): Message[] {
  return msg.map((m) => {
    if (m.content?.length) return m;

    return {
      ...m,
      content:
        m.parts
          ?.filter((m) => m.type === "text")
          ?.map((m) => m.text)
          ?.join(";") || "",
    } as Message;
  });
}

export function aiMessageToSdkMessage<
  Type extends Message | UIMessage = Message
>(msg: AiMessage): Type {
  return {
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
    createdAt: msg.createdAt,
    annotations: msg.annotations,
    experimental_attachments: msg.experimental_attachments,
    content: msg.parts
      .filter((m) => m.type === "text")
      .map((m) => m.text)
      .join(";"),
  } as Type;
}

export interface Chat {
  uuid: string;
  namePrefix: string;
}

export interface NewChatEventMap {
  newChat: Chat;
  provider: ChatProvider;
}

export interface ChatSession {
  engine: ChatEngine;
  messages: AiMessage[];
}

export const updateChat = (
  engine: ChatEngine,
  uuid: string,
  _messages: Message[]
): void => {
  const messages = _messages.map((m) => sdkMessageToAiMessage(m));
  localStorage.setItem(
    uuid,
    JSON.stringify({ messages, engine } as ChatSession)
  );
};

export const createChat = (
  provider: ChatProvider,
  uuid: string,
  engine: ChatEngine,
  _messages: Message[]
): string => {
  if (
    !_messages ||
    !_messages[0] ||
    !_messages[0].parts ||
    !_messages[0].parts[0] ||
    !(_messages[0].parts[0] as TextUIPart | undefined)
  ) {
    console.error("Invalid messages.", _messages);
    throw new Error(
      "Invalid messages passed to createChat. Check the console for more information."
    );
  }

  const messages = _messages.map((m) => sdkMessageToAiMessage(m));
  const firstMessageText = (messages[0].parts[0] as TextUIPart).text;
  const chats: Chat[] = JSON.parse(
    localStorage.getItem(`${provider as string}-chats`) || "[]"
  );
  const subText: string = firstMessageText.substring(0, 10);
  const newChat: Chat = {
    uuid,
    namePrefix: firstMessageText.length > 10 ? `${subText} ...` : subText,
  };
  localStorage.setItem(
    `${provider as string}-chats`,
    JSON.stringify([newChat, ...chats])
  );

  localStorage.setItem(
    uuid,
    JSON.stringify({ messages, engine } as ChatSession)
  );

  window.dispatchEvent(
    new CustomEvent<NewChatEventMap>("NewChat", {
      detail: { newChat, provider },
    })
  );

  return uuid;
};

export type NewChatHandler = (e: CustomEventInit<NewChatEventMap>) => void;
export const newChatListener = (handler: NewChatHandler) => {
  window.addEventListener("NewChat", handler);
  return () => {
    window.removeEventListener("NewChat", handler);
  };
};

export const getChat = (
  provider: ChatProvider,
  chatId: string
): ChatSession | null =>
  JSON.parse(localStorage.getItem(chatId) || "null") as ChatSession | null;

export const getChatsForNavbar = (provider: ChatProvider): Chat[] =>
  JSON.parse(
    localStorage.getItem(`${provider as string}-chats`) || "[]"
  ) as Chat[];
