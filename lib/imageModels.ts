import { companyToWebsiteMap } from "@/lib/aiCompaniesForBackend";
import prisma from "@/lib/prisma";
import type { ImageInput, ImageModel as ImageModelDb } from "@/prisma/client";
import type { JsonValue } from "@/prisma/client/runtime/library";
import { revalidateTag, unstable_cache } from "next/cache";
import NodeCache from "node-cache";

import { usdToCredit } from "./cost";
import { ratioEnumKeyToLabel } from "./ratio";

export interface ImageModelView {
  id: number;
  name: string;
  code: string;
  ratios: string[];
  description: string;
  companyWebsite: string;
  imageInput: ImageInput;
  defaultOptions: JsonValue;
  creditCostPerImage: number;
  showCaseImage?: string;
}

export type ImageModelDto = Pick<
  ImageModelDb,
  | "id"
  | "code"
  | "name"
  | "description"
  | "cost"
  | "imageInput"
  | "defaultOptions"
  | "showCaseImage"
> & { companyWebsite: string; ratios: string[] };

const getImageModels = async (): Promise<ImageModelDto[]> => {
  const rows =
    (await prisma.imageModel.findMany({
      where: { disabled: false },
      orderBy: [{ id: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        cost: true,
        ratios: true,
        description: true,
        imageInput: true,
        defaultOptions: true,
        showCaseImage: true,
      },
    })) || [];

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

export const getImageModelsMap = async () => {
  const cached = cache.get("imageModelsMap");
  if (cached) return cached as Map<string, ImageModelDto>;
  const map = new Map<string, ImageModelDto>();
  (await getImageModels()).forEach((m) => map.set(m.code, m));
  cache.set("imageModelsMap", map);
  try {
    revalidateTag("imageModelsForWeb");
  } catch {}
  return map;
};

// Web DTO (add showCaseImage)
export type ImageModelPricingDto = Pick<
  ImageModelDto,
  | "code"
  | "name"
  | "description"
  | "companyWebsite"
  | "imageInput"
  | "ratios"
  | "defaultOptions"
  | "showCaseImage"
> & { creditCostPerImage: number };

export const getImageModelsForWeb = unstable_cache(
  async () => {
    const cached = cache.get("imageModelsForWeb");
    if (cached) return cached as ImageModelPricingDto[];

    const modelsForWeb = (await getImageModels()).map(
      ({
        code,
        name,
        description,
        cost,
        companyWebsite,
        imageInput,
        ratios,
        defaultOptions,
        showCaseImage,
      }) => ({
        code,
        name,
        ratios,
        imageInput,
        defaultOptions,
        description,
        companyWebsite,
        showCaseImage,
        creditCostPerImage: usdToCredit(cost, false),
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
