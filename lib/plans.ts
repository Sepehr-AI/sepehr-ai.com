"use server";

import prisma from "@/lib/prisma";
import getExchangeRate from "./exchange";
import { unstable_cache } from "next/cache";
import type { WebPlan } from "@/prisma/client";
import { numberToReadableFarsi, roundWebPlan } from "./cost";

export type webPlansForUsers = ((Pick<WebPlan, "id" | "name" | "credits"> &
  Partial<WebPlan>) & { displayPrice: string; price: number })[];

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
      ).map((p: WebPlan) => {
        const price = roundWebPlan(p.usdAmount * exchangeRate);
        return {
          ...p,
          price,
          usdAmount: undefined,
          displayPrice: numberToReadableFarsi(price / 10),
        };
      }) || []
    );
  },
  ["webPlans"],
  { revalidate: 60 * 60 * 24 },
);
