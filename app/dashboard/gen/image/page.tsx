"use server";

import ImageGenComponent from "./ImageComponent";
import { getImageModelsForWeb } from "@/lib/imageModels";

export default async function ImageGenPage() {
  const imageModels = await getImageModelsForWeb();

  return <ImageGenComponent imageModels={imageModels} />;
}
