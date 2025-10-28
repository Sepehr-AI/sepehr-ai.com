import { companyToWebsiteMap } from "@/lib/aiCompaniesForBackend";
import prisma from "@/lib/prisma";
import type { ImageModel as ImageModelDb } from "@/prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import NodeCache from "node-cache";

import { usdToCredit } from "./cost";
import { error } from "./log";
import { type ModelInput, modelInputSchema } from "./modelInput";

export type ImageModelDto = Pick<
  ImageModelDb,
  | "id"
  | "code"
  | "name"
  | "description"
  | "costPerImage"
  | "shortDescription"
  | "defaultOptions"
  | "hasShowCaseImage"
> & { companyWebsite: string; inputSchema: ModelInput };

const getImageModels = async (): Promise<ImageModelDto[]> => {
  const rows =
    (await prisma.imageModel.findMany({
      where: { disabled: false },
      orderBy: [{ id: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        costPerImage: true,
        description: true,
        inputSchema: true,
        defaultOptions: true,
        hasShowCaseImage: true,
        shortDescription: true,
      },
    })) || [];

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

export const getImageModelsMap = async () => {
  const cached = cache.get("imageModelsMap");
  if (cached) return cached as Map<string, ImageModelDto>;
  const map = new Map<string, ImageModelDto>();
  (await getImageModels()).forEach((m) => map.set(m.code, m));
  cache.set("imageModelsMap", map);
  try {
    revalidateTag("imageModelsForWeb", "max");
  } catch {}
  return map;
};

export type ImageModelPricingDto = Pick<
  ImageModelDto,
  | "code"
  | "name"
  | "description"
  | "companyWebsite"
  | "shortDescription"
  | "defaultOptions"
  | "hasShowCaseImage"
> & { unitCost: number; inputSchema: ModelInput };

export const getImageModelsForWeb = unstable_cache(
  async () => {
    const cached = cache.get("imageModelsForWeb");
    if (cached) return cached as ImageModelPricingDto[];

    const modelsForWeb = (await getImageModels()).map(
      ({
        code,
        name,
        description,
        companyWebsite,
        defaultOptions,
        inputSchema,
        costPerImage,
        hasShowCaseImage,
        shortDescription,
      }) => ({
        code,
        name,
        inputSchema,
        defaultOptions,
        description,
        companyWebsite,
        hasShowCaseImage,
        shortDescription,
        unitCost: usdToCredit(costPerImage, false),
      }),
    );

    cache.set("imageModelsForWeb", modelsForWeb);
    return modelsForWeb;
  },
  ["imageModelsForWeb"],
  { revalidate: 60 * 60 },
);

export const getWebImageModelsLength = async () =>
  (await getImageModelsForWeb()).length;
