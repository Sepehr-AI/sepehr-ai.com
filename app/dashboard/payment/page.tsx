"use server";

import PaymentLayout from "@/components/payment/Layout";
import { usdToCredit } from "@/lib/cost";
import { getWebPlans } from "@/lib/plans";
import { headers } from "next/headers";
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
  const couponError =
    typeof searchParams["couponError"] === "string"
      ? (searchParams["couponError"] as string)
      : Array.isArray(searchParams["couponError"])
        ? (searchParams["couponError"][0] as string)
        : undefined;
  const selectedPlanParam = searchParams["selectedPlan"];
  const defaultSelectedPlanId =
    typeof selectedPlanParam === "string"
      ? Number(selectedPlanParam)
      : Array.isArray(selectedPlanParam)
        ? Number(selectedPlanParam[0])
        : undefined;

  return (
    <PaymentLayout
      plans={plans.reverse()}
      webBalance={usdToCredit(userBalance)}
      balanceInsufficient={balanceInsufficient}
      couponError={couponError}
      defaultSelectedPlanId={defaultSelectedPlanId}
    />
  );
}
