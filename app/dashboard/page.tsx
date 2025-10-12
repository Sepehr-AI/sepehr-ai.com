"use server";

import { getLanguageModelsForWeb } from "@/lib/languageModels";

import { NewChatWrapper } from "./ChatComponent";

export default async function DashboardPage() {
  const models = await getLanguageModelsForWeb();

  return <NewChatWrapper models={models} />;
}
