"use server";

import GenComponent from "@/components/gen/GenComponent";
import { getVideoModelsForWeb } from "@/lib/videoModels";

export default async function VideoGenPage({
  searchParams: _params,
}: {
  searchParams: Promise<{ selectedModel?: string }>;
}) {
  const searchParams = await _params;
  const models = await getVideoModelsForWeb();
  const code = searchParams?.selectedModel || models[0].code;
  const model = models.find((m) => m.code === code)!;

  return (
    <GenComponent
      kind="VIDEO"
      model={model}
      submitLabel="ساخت ویدئو"
      header="ساخت ویدئو با هوش مصنوعی"
    />
  );
}
