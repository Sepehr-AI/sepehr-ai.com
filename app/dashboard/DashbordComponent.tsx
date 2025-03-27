"use client";

import { Model } from "@/lib/models";
import dynamic from "next/dynamic";

const Chat = dynamic(() => import("../components/Chat"), { ssr: false });

export default function DashboardComponent({ models }: { models: Model[] }) {
  return <Chat models={models} />;
}
