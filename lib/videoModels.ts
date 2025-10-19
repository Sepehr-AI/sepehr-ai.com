import { companyToWebsiteMap } from "@/lib/aiCompaniesForBackend";
import prisma from "@/lib/prisma";
import type { VideoModel as VideoModelDb } from "@/prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import NodeCache from "node-cache";

import { usdToCredit } from "./cost";
import { ratioEnumKeyToLabel } from "./ratio";

export interface VideoModelDto
  extends Pick<
    VideoModelDb,
    | "id"
    | "code"
    | "name"
    | "description"
    | "cost"
    | "durations"
    | "defaultOptions"
    | "image"
    | "startImage"
    | "endImage"
    | "firstFrameImage"
    | "lastFrameImage"
    | "audio"
    | "hasShowCaseVideo"
    | "shortDescription"
    | "userNotes"
    | "allowedReferenceImages"
  > {
  ratios: string[];
  companyWebsite: string;
}

const getVideoModels = async (): Promise<VideoModelDto[]> => {
  const rows = await prisma.videoModel.findMany({
    where: { disabled: false },
    orderBy: [{ id: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      cost: true,
      ratios: true,
      durations: true,
      description: true,
      defaultOptions: true,
      image: true,
      startImage: true,
      endImage: true,
      firstFrameImage: true,
      lastFrameImage: true,
      userNotes: true,
      audio: true,
      shortDescription: true,
      hasShowCaseVideo: true,
      allowedReferenceImages: true,
    },
  });

  return rows.map((m) => {
    const vendor = m.code.split("/")[0] || "";
    const companyWebsite =
      (companyToWebsiteMap as Record<string, string>)[vendor] || "";
    return {
      ...m,
      companyWebsite,
      ratios: m.ratios.map((r) => ratioEnumKeyToLabel(r)),
    };
  });
};

const cache = new NodeCache({ stdTTL: 60 * 60 });

export const getVideoModelsMap = async () => {
  const cached = cache.get("videoModelsMap");
  if (cached) return cached as Map<string, VideoModelDto>;
  const map = new Map<string, VideoModelDto>();
  (await getVideoModels()).forEach((m) => map.set(m.code, m));
  cache.set("videoModelsMap", map);
  try {
    revalidateTag("videoModelsForWeb");
  } catch {}
  return map;
};

// Web DTO (add showCaseImage/showCaseVideo)
export type VideoModelPricingDto = Pick<
  VideoModelDto,
  | "code"
  | "name"
  | "description"
  | "companyWebsite"
  | "ratios"
  | "durations"
  | "defaultOptions"
  | "image"
  | "startImage"
  | "endImage"
  | "firstFrameImage"
  | "lastFrameImage"
  | "audio"
  | "userNotes"
  | "shortDescription"
  | "hasShowCaseVideo"
  | "allowedReferenceImages"
> & { creditCostPerVideo: number };

export const getVideoModelsForWeb = unstable_cache(
  async (): Promise<VideoModelPricingDto[]> => {
    const cached = cache.get("videoModelsForWeb");
    if (cached) return cached as VideoModelPricingDto[];

    const modelsForWeb = (await getVideoModels()).map(
      ({
        code,
        name,
        description,
        companyWebsite,
        cost,
        ratios,
        durations,
        defaultOptions,
        image,
        startImage,
        endImage,
        firstFrameImage,
        lastFrameImage,
        allowedReferenceImages,
        audio,
        userNotes,
        hasShowCaseVideo,
        shortDescription,
      }) => ({
        code,
        name,
        description,
        companyWebsite,
        ratios,
        durations,
        defaultOptions,
        image,
        startImage,
        endImage,
        firstFrameImage,
        lastFrameImage,
        allowedReferenceImages,
        audio,
        userNotes,
        hasShowCaseVideo,
        shortDescription,
        creditCostPerVideo: usdToCredit(cost, false),
      }),
    );

    cache.set("videoModelsForWeb", modelsForWeb);
    return modelsForWeb;
  },
  ["videoModelsForWeb"],
  { revalidate: 60 * 60 },
);

export const getWebVideoModelsLength = async () =>
  (await getVideoModelsForWeb()).length;
