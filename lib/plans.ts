"use server";

import { WebPlans } from "@prisma/client";
import { unstable_cache } from "next/cache";

export type webPlansForUsers = (Pick<
  WebPlans,
  "id" | "name" | "credits" | "displayPrice"
> &
  Partial<WebPlans>)[];

export const getWebPlans: () => Promise<webPlansForUsers> = unstable_cache(
  async () =>
    (await prisma.webPlans.findMany({
      select: { id: true, name: true, credits: true, displayPrice: true },
      orderBy: {
        id: "desc",
      },
    })) || [],
  ["webPlans"],
  { revalidate: 60 * 60 * 24 }
);
