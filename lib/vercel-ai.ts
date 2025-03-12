"use client";

import { Attachment, JSONValue, Message, ToolInvocation, UIMessage } from "ai";
import { EventHandler, listenOnEvent, dispatchEvent } from "./eventTransfer";

export type LanguageModelV1ProviderMetadata = Record<
  string,
  Record<string, JSONValue>
>;

export type LanguageModelV1Source = {
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
Reason why a language model finished generating a response.

Can be one of the following:
- `stop`: model generated stop sequence
- `length`: model generated maximum number of tokens
- `content-filter`: content filter violation stopped the model
- `tool-calls`: model triggered tool calls
- `error`: model stopped because of an error
- `other`: model stopped for other reasons
- `unknown`: the model has not transmitted a finish reason
 */
export type LanguageModelV1FinishReason =
  | "stop"
  | "length"
  | "content-filter"
  | "tool-calls"
  | "error"
  | "other"
  | "unknown";

/**
 * A text part of a message.
 */
export type TextUIPart = {
  type: "text";
  /**
   * The text content.
   */
  text: string;
};
/**
 * A reasoning part of a message.
 */
export type ReasoningUIPart = {
  type: "reasoning";
  /**
   * The reasoning text.
   */
  reasoning: string;
};
/**
 * A tool invocation part of a message.
 */
export type ToolInvocationUIPart = {
  type: "tool-invocation";
  /**
   * The tool invocation.
   */
  toolInvocation: ToolInvocation;
};
/**
 * A source part of a message.
 */
export type SourceUIPart = {
  type: "source";
  /**
   * The source.
   */
  source: LanguageModelV1Source;
};

/**
 * AI SDK UI Messages. They are used in the client and to communicate between the frontend and the API routes.
 */
export interface AiMessage {
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

export function sdkMessageToAiMessage(
  msg: Message | UIMessage,
  partsFilter?: (
    p: TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart
  ) => boolean
): AiMessage {
  if (!msg.parts) {
    console.error("Invalid message.", msg);
    throw new Error(
      "Invalid message passed to sdkMessageToAiMessage. Check the console for more information."
    );
  }

  return {
    id: msg.id,
    role: msg.role,
    createdAt: msg.createdAt,
    annotations: msg.annotations,
    experimental_attachments: msg.experimental_attachments,
    parts: (!partsFilter ? msg.parts : msg.parts.filter(partsFilter)).filter(
      (v) => v.type !== "reasoning" || v.reasoning.trim().length
    ),
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
  engine: string;
  namePrefix: string;
}

export interface NewChatEventMap {
  newChat: Chat;
  provider: string;
}

export interface ChatSession {
  engine: string;
  messages: AiMessage[];
}

const dbPromise: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request: any =
    typeof indexedDB !== "undefined" ? indexedDB.open("chatDB", 1) : {};
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("sessions")) {
      db.createObjectStore("sessions"); // key provided manually
    }
    if (!db.objectStoreNames.contains("chats")) {
      db.createObjectStore("chats"); // single record keyed by "chats"
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const openDB = (): Promise<IDBDatabase> => dbPromise;

const putData = async (
  storeName: string,
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getData = async (storeName: string, key: string): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const engineToProvider = (engine: string) =>
  engine.split("/")[0] || "unknown";

export const updateChat = async (
  uuid: string,
  engine: string,
  _messages: Message[]
): Promise<void> =>
  await putData("sessions", uuid, {
    engine,
    messages: _messages.map((m) => sdkMessageToAiMessage(m)),
  } as ChatSession);
// localStorage.setItem(
//   uuid,
//   JSON.stringify({
//     engine,
//     messages: _messages.map((m) => sdkMessageToAiMessage(m)),
//   } as ChatSession)
// );

export const createChat = async (
  uuid: string,
  engine: string,
  _messages: Message[]
): Promise<string> => {
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

  const provider: string = engineToProvider(engine);
  const messages = _messages.map((m) => sdkMessageToAiMessage(m));
  let firstMessageText: string;
  if ((messages[0].parts[0] as TextUIPart).text) {
    firstMessageText = (messages[0].parts[0] as TextUIPart).text;
  } else {
    const _firstMessageText = messages[0].parts.find(
      (p) => p.type === "text"
    )?.text;
    if (_firstMessageText) firstMessageText = _firstMessageText;
    else firstMessageText = uuid;
  }

  const chats: Chat[] = (await getData("chats", "chats")) || [];
  // const chats: Chat[] = JSON.parse(localStorage.getItem("chats") || "[]");
  const subText: string = firstMessageText.substring(0, 30);
  const newChat: Chat = {
    uuid,
    engine,
    namePrefix: firstMessageText.length > 30 ? `${subText} ...` : subText,
  };
  await putData("chats", "chats", [newChat, ...chats]);
  // localStorage.setItem("chats", JSON.stringify([newChat, ...chats]));

  await putData("sessions", uuid, { messages, engine } as ChatSession);
  // localStorage.setItem(
  //   uuid,
  //   JSON.stringify({ messages, engine } as ChatSession)
  // );

  dispatchEvent<NewChatEventMap>("NewChat", { newChat, provider });

  return uuid;
};

export type NewChatHandler = EventHandler<NewChatEventMap>;
export const newChatListener = (handler: NewChatHandler) =>
  listenOnEvent<NewChatEventMap>("NewChat", handler);

export const getChat = async (chatId: string): Promise<ChatSession | null> =>
  (await getData("sessions", chatId)) || null;
// JSON.parse(localStorage.getItem(chatId) || "null") as ChatSession | null;

export const getChatsForNavbar = async (): Promise<Chat[]> =>
  (await getData("chats", "chats")) || [];
// JSON.parse(localStorage.getItem("chats") || "[]") as Chat[];
