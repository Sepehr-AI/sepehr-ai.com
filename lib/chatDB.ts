/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { Message } from "ai";
import { EventHandler, listenOnEvent, dispatchEvent } from "./eventTransfer";
import { AiMessage, sdkMessageToAiMessage, TextUIPart } from "./vercel-ai";
import { decodeJwt } from "jose";

export interface Chat {
  engine: string;
  namePrefix: string;
}

export interface DbChat {
  key: string;
  value: Chat;
}

export interface NewChatEventMap {
  newChat: DbChat;
  provider: string;
}

export interface ChatSession {
  engine: string;
  messages: AiMessage[];
}

const DATABASE_VERSION: number = 1;

function getCookieValue(name: string): string | undefined {
  const regex = new RegExp(`(^| )${name}=([^;]+)`);
  const match = typeof document !== "undefined" && document.cookie.match(regex);
  if (match) return match[2];
}

const dbPromise: Promise<IDBDatabase> = new Promise(async (resolve, reject) => {
  const payload = decodeJwt(getCookieValue("token") || "unknown");
  let userId: number | string = Number((payload as any).id || "abc");
  userId = !isNaN(Number(userId)) ? userId : "unknown";

  if (process.env.NODE_ENV === "development") {
    console.log({ token: getCookieValue("token"), payload, userId });
  }

  const request: any =
    typeof indexedDB !== "undefined"
      ? indexedDB.open(`${userId}-chats`, DATABASE_VERSION)
      : {};
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("sessions")) {
      db.createObjectStore("sessions");
    }
    if (!db.objectStoreNames.contains("chats")) {
      db.createObjectStore("chats");
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const openDB = (): Promise<IDBDatabase> => dbPromise;

const putData = async (
  storeName: string,
  key: string,
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
const getAllData = async (
  storeName: string
): Promise<{ key: IDBValidKey; value: any }[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.openCursor();
    const result: { key: IDBValidKey; value: any }[] = [];
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        result.push({ key: cursor.key, value: cursor.value });
        cursor.continue();
      } else {
        resolve(result);
      }
    };
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

  const subText: string = firstMessageText.substring(0, 20);
  const newChat: DbChat = {
    key: uuid,
    value: {
      engine,
      namePrefix: firstMessageText.length > 20 ? `${subText} ...` : subText,
    },
  };

  await putData("chats", uuid, newChat.value);
  await putData("sessions", uuid, { messages, engine } as ChatSession);

  dispatchEvent<NewChatEventMap>("NewChat", { newChat, provider });

  return uuid;
};

export type NewChatHandler = EventHandler<NewChatEventMap>;
export const newChatListener = (handler: NewChatHandler) =>
  listenOnEvent<NewChatEventMap>("NewChat", handler);

export const getChat = async (chatId: string): Promise<ChatSession | null> =>
  (await getData("sessions", chatId)) || null;

export const getChatsForNavbar = () => getAllData("chats") as Promise<DbChat[]>;
