import { getImageModelsForWeb } from "@/lib/imageModels";
import { getVideoModelsForWeb } from "@/lib/videoModels";

export async function findModelByCode(code: string) {
  const [images, videos] = await Promise.all([
    getImageModelsForWeb(),
    getVideoModelsForWeb(),
  ]);

  const im = images.find((x) => x.code === code);
  if (im) return { kind: "IMAGE" as const, model: im };
  const vm = videos.find((x) => x.code === code);
  if (vm) return { kind: "VIDEO" as const, model: vm };

  return null;
}
