"use server";

import { getModelsForWeb } from "@/lib/models";
import { NewChatWrapper } from "./ChatComponent";

export default async function DashboardPage() {
  const models = await getModelsForWeb();

  return <NewChatWrapper models={models} />;
}
