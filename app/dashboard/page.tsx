"use server";

import { getModelsForWeb } from "@/lib/models";
import DashboardComponent from "./DashbordComponent";

export default async function DashboardPage() {
  const models = await getModelsForWeb();
  return <DashboardComponent models={models} />;
}
