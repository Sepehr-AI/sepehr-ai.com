import NodeCache from "node-cache";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma, TiktokenEncoding, type LlmModel } from "@/lib/prisma";

export { TiktokenEncoding };

export interface Model {
  id: number;
  name: string;
  code: string;
  description: string;
  companyWebsite: string;
  creditCostPerMilInToken: number;
  creditCostPerMilOutToken: number;
  estimatedEncodingBase: TiktokenEncoding;
}

const getModels = async (): Promise<LlmModel[]> => {
  return (
    (await prisma.llmModel.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        companyWebsite: true,
        useToComparePlans: true,
        costPerMilInToken: true,
        costPerMilOutToken: true,
        estimatedEncodingBase: true,
      },
    })) || []
  );
};

const cache = new NodeCache({ stdTTL: 60 * 60 });

export const getModelsMap: () => Promise<Map<string, LlmModel>> = async () => {
  const cached = cache.get("modelsMap");
  if (cached) return cached as Map<string, LlmModel>;

  const map = new Map<string, LlmModel>();
  (await getModels()).forEach((m) => map.set(m.code, m));
  cache.set("modelsMap", map);
  try {
    revalidateTag("modelsForWeb");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {}

  return map;
};

export const getModelsForWeb: () => Promise<Model[]> = unstable_cache(
  async () => {
    const cached = cache.get("modelsForWeb");
    if (cached) return cached as Model[];

    const modelsForWeb = (await getModels()).map(
      ({
        code,
        name,
        description,
        costPerMilInToken,
        costPerMilOutToken,
        companyWebsite,
      }) => {
        const creditCostPerMilInToken = costPerMilInToken * 2 * 1000;
        const creditCostPerMilOutToken = costPerMilOutToken * 2 * 1000;

        return {
          code,
          name,
          description,
          companyWebsite,
          creditCostPerMilInToken,
          creditCostPerMilOutToken,
        } as Model;
      }
    );
    cache.set("modelsForWeb", modelsForWeb);

    return modelsForWeb;
  },
  ["modelsForWeb"],
  { revalidate: 60 * 60 }
);

export const getModelsForPlanComparison: () => Promise<Model[]> =
  unstable_cache(
    async () => {
      const cached = cache.get("modelsForWeb");
      if (cached) return cached as Model[];

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
          } as Model);
        }
        return acc;
      }, [] as Model[]);

      cache.set("getModelsForPlanComparison", modelsForWeb);

      return modelsForWeb;
    },
    ["getModelsForPlanComparison"],
    { revalidate: 60 * 60 }
  );
