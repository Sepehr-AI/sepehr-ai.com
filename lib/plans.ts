"use server";

import getExchangeRate from "./exchange";
import { unstable_cache } from "next/cache";
import { prisma, type WebPlan } from "@/lib/prisma";
import { numberToReadableFarsi, roundWebPlan } from "./cost";

export type webPlansForUsers = ((Pick<WebPlan, "id" | "name" | "credits"> &
  Partial<WebPlan>) & { displayPrice: number })[];

export const getWebPlans: () => Promise<webPlansForUsers> = unstable_cache(
  async () => {
    const exchangeRate = await getExchangeRate();
    return (
      (
        await prisma.webPlan.findMany({
          select: { id: true, name: true, credits: true, usdAmount: true },
          orderBy: {
            id: "desc",
          },
        })
      ).map((p: WebPlan) => ({
        ...p,
        usdAmount: undefined,
        displayPrice: numberToReadableFarsi(
          roundWebPlan((p.usdAmount * exchangeRate) / 10)
        ),
      })) || []
    );
  },
  ["webPlans"],
  { revalidate: 60 * 60 * 24 }
);
