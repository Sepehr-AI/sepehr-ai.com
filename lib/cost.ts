import { LlmModel } from "@prisma/client";

export function roundWebCost(cost: number): number {
  return +(Math.round((cost + "e+3") as unknown as number) + "e-3");
}

export function calcWebCostCost(
  inTokens: number,
  outTokens: number,
  model: LlmModel,
): number {
  return roundWebCost(
    (model.costPerMilInToken * 2 * Math.floor(inTokens)) / 1_000_000 +
      (model.costPerMilOutToken * 2 * Math.floor(outTokens)) / 1_000_000,
  );
}
