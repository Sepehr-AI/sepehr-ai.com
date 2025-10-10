// lib/languageModels.ts
import prisma from "@/lib/prisma";
import NodeCache from "node-cache";
import { usdToCredit } from "./cost";
import { revalidateTag, unstable_cache } from "next/cache";
import { companyToWebsiteMap } from "@/lib/aiCompaniesForBackend";
import type { LanguageModel as LanguageModelDb } from "@/prisma/client";

export type LanguageModelDto = Pick<
  LanguageModelDb,
  | "id" | "code" | "name" | "description"
  | "maxCompletionTokens" | "milInCost" | "milOutCost"
  | "supportsMessages" | "imageInput"
  | "showCaseImage" // NEW
> & {
  companyWebsite: string;
};

const getLanguageModels = async (): Promise<LanguageModelDto[]> => {
  const rows =
    (await prisma.languageModel.findMany({
      where: { disabled: false },
      orderBy: [{ id: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        maxCompletionTokens: true,
        milInCost: true,
        milOutCost: true,
        supportsMessages: true,
        imageInput: true,
        showCaseImage: true, // NEW
      },
    })) || [];

  return rows.map((m) => {
    const vendor = m.code.split("/")[0] || "";
    const companyWebsite =
      (companyToWebsiteMap as Record<string, string>)[vendor] || "";
    return { ...m, companyWebsite };
  });
};

const cache = new NodeCache({ stdTTL: 60 * 60 });

export const getLanguageModelsMap = async () => {
  const cached = cache.get("languageModelsMap");
  if (cached) return cached as Map<string, LanguageModelDto>;
  const map = new Map<string, LanguageModelDto>();
  (await getLanguageModels()).forEach((m) => map.set(m.code, m));
  cache.set("languageModelsMap", map);
  try { revalidateTag("languageModelsForWeb"); } catch { }
  return map;
};

// Web DTO (add showCaseImage)
export type LanguageModelPricingDto = Pick<
  LanguageModelDto,
  "code" | "name" | "description" | "companyWebsite" | "showCaseImage"
> & {
  milInCreditCost: number;
  milOutCreditCost: number;
};

export const getLanguageModelsForWeb = unstable_cache(
  async () => {
    const cached = cache.get("languageModelsForWeb");
    if (cached) return cached as LanguageModelPricingDto[];

    const modelsForWeb = (await getLanguageModels()).map(
      ({ code, name, description, milInCost, milOutCost, companyWebsite, showCaseImage }) => ({
        code,
        name,
        description,
        companyWebsite,
        showCaseImage,
        milInCreditCost: usdToCredit(milInCost, true),
        milOutCreditCost: usdToCredit(milOutCost, true),
      }),
    );

    cache.set("languageModelsForWeb", modelsForWeb);
    return modelsForWeb;
  },
  ["languageModelsForWeb"],
  { revalidate: 60 * 60 },
);

export const getWebLanguageModelsLength = async () =>
  (await getLanguageModelsForWeb()).length;