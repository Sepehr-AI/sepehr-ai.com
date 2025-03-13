"use server";

import PaymentLayout from "./Layout";
import { headers } from "next/headers";
import { getWebPlans } from "@/lib/plans";

export default async function PaymentPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await _searchParams;
  const headersList = await headers();
  const webBalanceHeader = Number(headersList.get("userWebBalance"));
  const webBalance =
    (!isNaN(webBalanceHeader) ? webBalanceHeader : 0) * 2 * 1000;
  const plans = await getWebPlans();
  const balanceInsufficient: boolean =
    searchParams["balanceInsufficient"]?.toString().toLowerCase() === "true";

  return (
    <PaymentLayout
      plans={plans}
      webBalance={webBalance}
      balanceInsufficient={balanceInsufficient}
    />
  );
}
