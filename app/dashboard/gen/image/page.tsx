"use server";

import ImageGenComponent from "@/components/gen/ImageComponent";
import { getImageModelsForWeb } from "@/lib/imageModels";

export default async function ImageGenPage({
  searchParams: _params,
}: {
  searchParams: Promise<{ selectedModel?: string }>;
}) {
  const searchParams = await _params;
  const imageModels = await getImageModelsForWeb();
  const selected = searchParams?.selectedModel;
  const initialModelCode =
    selected && imageModels.some((m) => m.code === selected)
      ? selected
      : imageModels[0]?.code;

  return (
    <ImageGenComponent
      imageModels={imageModels}
      initialModelCode={initialModelCode}
    />
  );
}
