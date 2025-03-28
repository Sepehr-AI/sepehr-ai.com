"use client";

import nextDynamic from "next/dynamic";

export const dynamic = "force-static";

const ChatComponent = nextDynamic(() => import("./ChatComponent"), {
  ssr: false,
});

export default ChatComponent;
