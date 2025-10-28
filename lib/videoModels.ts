import { companyToWebsiteMap } from "@/lib/aiCompaniesForBackend";
import prisma from "@/lib/prisma";
import type { VideoModel as VideoModelDb } from "@/prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import NodeCache from "node-cache";

import { usdToCredit } from "./cost";
import { error } from "./log";
import { type ModelInput, modelInputSchema } from "./modelInput";

export interface VideoModelDto
  extends Pick<
    VideoModelDb,
    | "id"
    | "code"
    | "name"
    | "description"
    | "costPerSecond"
    | "defaultOptions"
    | "hasShowCaseVideo"
    | "shortDescription"
  > {
  inputSchema: ModelInput;
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
      inputSchema: true,
      costPerSecond: true,
      description: true,
      defaultOptions: true,
      shortDescription: true,
      hasShowCaseVideo: true,
    },
  });

  return rows.map((m) => {
    const vendor = m.code.split("/")[0] || "";
    const companyWebsite =
      (companyToWebsiteMap as Record<string, string>)[vendor] || "";
    const inputSchemaParseRes = modelInputSchema.safeParse(m.inputSchema);
    if (!inputSchemaParseRes.success)
      error("modelInputSchema", inputSchemaParseRes.error);

    return {
      ...m,
      companyWebsite,
      inputSchema: inputSchemaParseRes.data!,
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
    revalidateTag("videoModelsForWeb", "max");
  } catch {}
  return map;
};

export type VideoModelPricingDto = Pick<
  VideoModelDto,
  | "code"
  | "name"
  | "description"
  | "companyWebsite"
  | "defaultOptions"
  | "shortDescription"
  | "hasShowCaseVideo"
> & { unitCost: number; inputSchema: ModelInput };

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
        costPerSecond,
        inputSchema,
        defaultOptions,
        hasShowCaseVideo,
        shortDescription,
      }) => ({
        code,
        name,
        description,
        companyWebsite,
        inputSchema,
        defaultOptions,
        hasShowCaseVideo,
        shortDescription,
        unitCost: usdToCredit(costPerSecond, false),
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
