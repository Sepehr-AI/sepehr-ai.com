"use client";

import { Message } from "ai";
import { EventHandler, listenOnEvent, dispatchEvent } from "./eventTransfer";
import { AiMessage, sdkMessageToAiMessage, TextUIPart } from "./vercel-ai";
import { decodeJwt } from "jose";

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

function getCookieValue(name: string): string | undefined {
  const regex = new RegExp(`(^| )${name}=([^;]+)`);
  const match = typeof document !== "undefined" && document.cookie.match(regex);
  if (match) return match[2];
}

let dbPromise: IDBDatabase | null = null;
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return new Error("Tring to access IndexedDB in Server-side!");
    }

    if (dbPromise) return dbPromise;

    const tokenValue = getCookieValue("token");
    if (!tokenValue) return reject("Couldn't find the token cookie!");

    const payload = decodeJwt(tokenValue);
    if (!payload) return reject("Invalid token cookie!");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userId: number | string = Number((payload as any).id || "abc");
    userId = !isNaN(userId) ? userId : "unkown";
    if (process.env.NODE_ENV === "development") {
      console.log({ token: tokenValue, payload, userId });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request: any =
      typeof indexedDB !== "undefined"
        ? indexedDB.open(`${userId}-chats`, 1)
        : {};
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions"); // key provided manually
      }
      if (!db.objectStoreNames.contains("chats")) {
        db.createObjectStore("chats"); // single record keyed by "chats"
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbPromise = request.result;
      resolve(request.result);
    };
  });
}

const putData = (
  storeName: string,
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<void> =>
  new Promise((resolve, reject) =>
    openDB()
      .then((db) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(data, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
      .catch((e) => reject(e))
  );
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getData = (storeName: string, key: string): Promise<any> =>
  new Promise((resolve, reject) =>
    openDB()
      .then((db) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
      .catch((e) => reject(e))
  );

export const engineToProvider = (engine: string) =>
  engine.split("/")[0] || "unknown";

export const updateChat = async (
  uuid: string,
  engine: string,
  _messages: Message[]
): Promise<void> => {
  try {
    await putData("sessions", uuid, {
      engine,
      messages: _messages.map((m) => sdkMessageToAiMessage(m)),
    } as ChatSession);
  } catch {}
};
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

  try {
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
  } catch {
    return "";
  }

  return uuid;
};

export type NewChatHandler = EventHandler<NewChatEventMap>;
export const newChatListener = (handler: NewChatHandler) =>
  listenOnEvent<NewChatEventMap>("NewChat", handler);

export const getChat = async (chatId: string): Promise<ChatSession | null> => {
  try {
    const res = (await getData("sessions", chatId)) || null;
    return res;
  } catch {
    return null;
  }
};
// JSON.parse(localStorage.getItem(chatId) || "null") as ChatSession | null;

export const getChatsForNavbar = async (): Promise<Chat[]> => {
  try {
    const res = (await getData("chats", "chats")) || [];
    return res;
  } catch {
    return [];
  }
};
// JSON.parse(localStorage.getItem("chats") || "[]") as Chat[];
