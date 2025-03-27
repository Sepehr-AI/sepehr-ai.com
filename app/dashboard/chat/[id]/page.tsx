"use client";

import dynamic from "next/dynamic";

const ChatComponent = dynamic(() => import("./ChatComponent"), { ssr: false });

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ChatComponent params={params} />;
}
