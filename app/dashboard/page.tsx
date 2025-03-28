"use server";

import Chat from "../components/Chat";
import { getModelsForWeb } from "@/lib/models";

export default async function DashboardPage() {
  const models = await getModelsForWeb();
  return <Chat models={models} />;
}
