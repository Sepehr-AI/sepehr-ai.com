import type {
  ChatRequestOptions,
  UIDataTypes,
  UIMessagePart,
  UITools,
} from "ai";
import { useEffect, useRef } from "react";

import type { InitialContext } from "./useInitialContext";

export function useAutoSend({
  sendMessage,
  initialContext,
  messagesLength,
}: {
  messagesLength: number;
  initialContext: InitialContext;
  sendMessage: (
    message: { parts: UIMessagePart<UIDataTypes, UITools>[] },
    options?: ChatRequestOptions,
  ) => void;
}) {
  const didRef = useRef(false);
  const [initialMessages, initialUser] = initialContext;

  useEffect(() => {
    if (
      initialUser &&
      !didRef.current &&
      messagesLength === initialMessages.length
    ) {
      sendMessage({ parts: initialUser.parts });
      didRef.current = true;
    }
  }, [
    initialUser,
    sendMessage,
    messagesLength,
    initialContext.length,
    initialMessages.length,
  ]);
}
