"use server";

import dayjs from "dayjs";
import prisma from "@/lib/prisma";
import utc from "dayjs/plugin/utc";
import getExchangeRate from "./exchange";
import { unstable_cache } from "next/cache";
import timezone from "dayjs/plugin/timezone";
import type { WebPlan } from "@/prisma/client";
import { numberToReadableFarsi, roundWebPlan } from "./cost";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tehran");

export type WebPlansForUsers = ((Pick<
  WebPlan,
  "id" | "name" | "usdCredits" | "discountEndsOn" | "discountPercentage"
> &
  Partial<WebPlan>) & {
    price: number;
    displayPrice: string;
    discountedDisplayPrice: string | null;
  })[];

export const getWebPlans: () => Promise<WebPlansForUsers> = unstable_cache(
  async () => {
    const exchangeRate = await getExchangeRate();
    return (
      (
        await prisma.webPlan.findMany({
          select: {
            id: true,
            name: true,
            usdPrice: true,
            usdCredits: true,
            discountEndsOn: true,
            discountPercentage: true,
          },
          orderBy: {
            id: "desc",
          },
        })
      ).map((p) => {
        let discountedPrice = null;
        const tehranNow = dayjs().tz("Asia/Tehran");
        const price = roundWebPlan(p.usdPrice * exchangeRate);
        if (
          p.discountEndsOn &&
          p.discountPercentage &&
          tehranNow.isBefore(dayjs(p.discountEndsOn).tz("Asia/Tehran"))
        ) {
          discountedPrice = roundWebPlan(
            price - (price * p.discountPercentage) / 100,
          );
        }

        return {
          ...p,
          price,
          usdAmount: undefined,
          discountEndsOn: p.discountEndsOn,
          discountPercentage: p.discountPercentage,
          displayPrice: numberToReadableFarsi(price / 10),
          discountedDisplayPrice: discountedPrice
            ? numberToReadableFarsi(discountedPrice / 10)
            : null,
        };
      }) || []
    );
  },
  ["webPlans"],
  { revalidate: 60 * 60 * 24 },
);
