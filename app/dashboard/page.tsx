"use server";

import { getModelsForWeb } from "@/lib/models";
import { LazyChat } from "../components/LazyChat";
import Loadable from "./Loadable";

export default async function DashboardPage() {
  const models = await getModelsForWeb();
  return (
    <Loadable>
      <LazyChat models={models} />
    </Loadable>
  );
}
