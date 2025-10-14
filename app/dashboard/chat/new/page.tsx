"use server";

import { NewChatWrapper } from "@/components/Chat/NewChatPage";
import { getLanguageModelsForWeb } from "@/lib/languageModels";

export default async function DashboardPage() {
  const models = await getLanguageModelsForWeb();

  return <NewChatWrapper models={models} />;
}
