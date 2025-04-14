/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import { error } from "@/lib/log";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import getExchangeRate from "@/lib/exchange";
import type { MiddlewareUserData } from "@/middleware";

const SEPEHR_AI_IPG_ADDR: string =
  process.env.SEPEHR_AI_IPG_ADDR || "localhost:4040";

interface SepehrAiIpgPayload {
  amount: number;
  payload: string;
  invoiceId: string;
}

function isString(obj: any): boolean {
  return Object.prototype.toString.call(obj) === "[object String]";
}

export async function chargeAccountAction(formData: FormData): Promise<void> {
  const headersList = await headers();
  const planId = Number(formData.get("planId"));
  const user: MiddlewareUserData = {
    webBalance: 0,
    id: Number(headersList.get("userId")),
    email: headersList.get("userEmail") as string,
    mobile: headersList.get("usermobile") as string,
  };

  if (isNaN(planId) || isNaN(user.id) || !user.email || !user.mobile) {
    console.error("Unexpected input:", { user });
    return redirect("/dashboard/payment");
  }

  const exchangeRate = await getExchangeRate();

  let usdAmount: number;
  let price: number;
  try {
    const webPlan = await prisma.webPlan.findUnique({
      where: { id: planId },
      select: { usdAmount: true },
    });
    if (!webPlan) throw new Error("PlanNotFound");
    usdAmount = webPlan.usdAmount;
    price = usdAmount * exchangeRate;
  } catch (e) {
    error("Database or exchange error:", {
      user,
      planId,
      error: e,
      exchangeRate,
    });
    return redirect("/dashboard/payment");
  }

  price = 10_000;

  const transaction = await prisma.transaction.create({
    data: {
      usdAmount,
      exchangeRate,
      amount: price,
      user: { connect: { id: user.id } },
    },
  });

  const invoiceId = transaction.id.toString();
  const paymentPayload: SepehrAiIpgPayload = {
    invoiceId,
    amount: price,
    payload: `پلن ${planId} برای کاربر ${user.id}`,
  };

  let data: any = undefined;
  // Redirect back to the home page on failure.
  let redirectUrl: string = "/dashboard/payment";
  try {
    const response = await fetch(`http://${SEPEHR_AI_IPG_ADDR}/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentPayload),
    });
    data = await response.json();

    if (
      data.status === "ok" &&
      data.paymentURL &&
      isString(data.paymentURL) &&
      data.paymentURL.length
    ) {
      redirectUrl = data.paymentURL;
    } else {
      throw new Error("sepehrAiIpgInitilizationFailed");
    }
  } catch (e) {
    error("UnableToConnectToSepehrAiIpgServer", { error: e, data });
  }

  return redirect(redirectUrl);
}
