"use server";

import VideoGenComponent from "@/components/gen/VideoGenComponent";
import { getVideoModelsForWeb } from "@/lib/videoModels";

export default async function VideoGenPage() {
  const videoModels = await getVideoModelsForWeb();
  return <VideoGenComponent videoModels={videoModels} />;
}
