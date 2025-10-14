"use client";

import nextDynamic from "next/dynamic";

export const dynamic = "force-static";

const ChatComponent = nextDynamic(
  () => import("@/components/Chat/MainChatPage"),
  {
    ssr: false,
  },
);

export default ChatComponent;
