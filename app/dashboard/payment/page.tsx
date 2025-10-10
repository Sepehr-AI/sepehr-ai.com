"use server";

import PaymentLayout from "./Layout";
import { headers } from "next/headers";
import { usdToCredit } from "@/lib/cost";
import { getWebPlans } from "@/lib/plans";
import { redirect } from "next/navigation";

export default async function PaymentPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const headersList = await headers();
  const userId = Number(headersList.get("userId") || "abc");
  const userBalance = Number(headersList.get("userBalance") || "abc");
  if (isNaN(userId) || isNaN(userBalance)) redirect("/auth");

  const searchParams = await _searchParams;
  const plans = await getWebPlans();
  const balanceInsufficient: boolean =
    searchParams["balanceInsufficient"]?.toString().toLowerCase() === "true";

  return (
    <PaymentLayout
      plans={plans.reverse()}
      webBalance={usdToCredit(userBalance)}
      balanceInsufficient={balanceInsufficient}
    />
  );
}
