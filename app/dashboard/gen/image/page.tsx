"use server";

import GenComponent from "@/components/gen/GenComponent";
import { getImageModelsForWeb } from "@/lib/imageModels";

export default async function ImageGenPage({
  searchParams: _params,
}: {
  searchParams: Promise<{ selectedModel?: string }>;
}) {
  const searchParams = await _params;
  const models = await getImageModelsForWeb();
  const code = searchParams?.selectedModel || models[0].code;
  const model = models.find((m) => m.code === code)!;

  return (
    <GenComponent
      kind="IMAGE"
      model={model}
      submitLabel="ساخت تصویر"
      header="ساخت تصویر با هوش مصنوعی"
    />
  );
}
