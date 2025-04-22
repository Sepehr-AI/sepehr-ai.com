import prisma from "@/lib/prisma";
import NodeCache from "node-cache";
import { usdToCredit } from "./cost";
import type { LlmModel } from "@/prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";

export interface Model {
  id: number;
  name: string;
  code: string;
  description: string;
  companyWebsite: string;
  creditCostPerMilInToken: number;
  creditCostPerMilOutToken: number;
}

export type LlmModelDto = Pick<
  LlmModel,
  | "id"
  | "code"
  | "name"
  | "description"
  | "contextLength"
  | "companyWebsite"
  | "useToComparePlans"
  | "costPerMilInToken"
  | "costPerMilOutToken"
>;

const getModels = async (): Promise<LlmModelDto[]> => {
  return (
    (await prisma.llmModel.findMany({
      orderBy: { id: "asc" },
      where: { disabled: false },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        contextLength: true,
        companyWebsite: true,
        useToComparePlans: true,
        costPerMilInToken: true,
        costPerMilOutToken: true,
      },
    })) || []
  );
};

const cache = new NodeCache({ stdTTL: 60 * 60 });

export const getModelsMap: () => Promise<
  Map<string, LlmModelDto>
> = async () => {
  const cached = cache.get("modelsMap");
  if (cached) return cached as Map<string, LlmModelDto>;

  const map = new Map<string, LlmModelDto>();
  (await getModels()).forEach((m) => map.set(m.code, m));
  cache.set("modelsMap", map);
  try {
    revalidateTag("modelsForWeb");
  } catch {}

  return map;
};

export type LlmModelPricingDto = Pick<
  LlmModel,
  "code" | "name" | "description" | "companyWebsite"
> & { creditCostPerMilInToken: number; creditCostPerMilOutToken: number };

export const getModelsForWeb: () => Promise<LlmModelPricingDto[]> =
  unstable_cache(
    async () => {
      const cached = cache.get("modelsForWeb");
      if (cached) return cached as LlmModelPricingDto[];

      const modelsForWeb = (await getModels()).map(
        ({
          code,
          name,
          description,
          costPerMilInToken,
          costPerMilOutToken,
          companyWebsite,
        }) => {
          const creditCostPerMilInToken = usdToCredit(costPerMilInToken);
          const creditCostPerMilOutToken = usdToCredit(costPerMilOutToken);

          return {
            code,
            name,
            description,
            companyWebsite,
            creditCostPerMilInToken,
            creditCostPerMilOutToken,
          } as LlmModelPricingDto;
        },
      );
      cache.set("modelsForWeb", modelsForWeb);

      return modelsForWeb;
    },
    ["modelsForWeb"],
    { revalidate: 60 * 60 },
  );

export const getModelsForPlanComparison: () => Promise<LlmModelPricingDto[]> =
  unstable_cache(
    async () => {
      const cached = cache.get("modelsForPlanComparison");
      if (cached) return cached as LlmModelPricingDto[];

      const modelsForWeb = (await getModels()).reduce((acc, model) => {
        // Only push models if useToComparePlans is true
        if (model.useToComparePlans) {
          const {
            code,
            name,
            description,
            costPerMilInToken,
            costPerMilOutToken,
          } = model;
          const creditCostPerMilInToken = costPerMilInToken * 2 * 1000;
          const creditCostPerMilOutToken = costPerMilOutToken * 2 * 1000;
          acc.push({
            code,
            name,
            description,
            creditCostPerMilInToken,
            creditCostPerMilOutToken,
          } as LlmModelPricingDto);
        }
        return acc;
      }, [] as LlmModelPricingDto[]);

      cache.set("modelsForPlanComparison", modelsForWeb);

      return modelsForWeb;
    },
    ["modelsForPlanComparison"],
    { revalidate: 60 * 60 },
  );

export const getWebModelsLength: () => Promise<number> = async () =>
  (await getModelsForWeb()).length;
