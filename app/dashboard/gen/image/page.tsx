"use server";

import { getImageModelsForWeb } from "@/lib/imageModels";

import ImageGenComponent from "./ImageComponent";

export default async function ImageGenPage() {
  const imageModels = await getImageModelsForWeb();

  return <ImageGenComponent imageModels={imageModels} />;
}
