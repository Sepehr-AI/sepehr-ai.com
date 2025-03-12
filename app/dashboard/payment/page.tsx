"use server";

import prisma from "@/lib/prisma";
import PaymentLayout from "./Layout";
import { headers } from "next/headers";
import { WebPlans } from "@prisma/client";
import { unstable_cache } from "next/cache";

const getCachedUser: () => Promise<WebPlans[]> = unstable_cache(
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

export default async function PaymentPage() {
  const headersList = await headers();
  const webBalanceHeader = Number(headersList.get("userWebBalance"));
  const webBalance =
    (!isNaN(webBalanceHeader) ? webBalanceHeader : 0) * 2 * 1000;
  const plans = await getCachedUser();

  return <PaymentLayout webBalance={webBalance} plans={plans} />;
}
