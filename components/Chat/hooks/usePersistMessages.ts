import { updateChat } from "@/lib/chatDB";
import type { ChatStatus, UIMessage } from "ai";
import { type Dispatch, type SetStateAction, useEffect } from "react";

export function usePersistMessages({
  status,
  chatUuid,
  messages,
  engineCode,
  initialMessages,
  aiCompanyWebsite,
  setMessagesCount,
}: {
  chatUuid: string;
  engineCode: string;
  status: ChatStatus;
  messages: UIMessage[];
  aiCompanyWebsite: string;
  initialMessages?: UIMessage[];
  setMessagesCount: Dispatch<SetStateAction<number>>;
}) {
  useEffect(() => {
    // User sent a new messages
    if (status === "submitted") {
      setMessagesCount((c) => c + 1);
    }

    if (messages.length !== (initialMessages?.length || 0)) {
      updateChat(chatUuid, engineCode, aiCompanyWebsite, messages);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, messages.length, initialMessages?.length]);
}
