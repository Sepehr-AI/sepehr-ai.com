"use server";

import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MiddlewareUserData } from "@/middleware";

export async function chargeAccount(formData: FormData) {
  const headersList = await headers();
  const planId = Number(formData.get("planId"));
  const user: MiddlewareUserData = {
    webBalance: 0,
    id: Number(headersList.get("userId")),
    email: headersList.get("userEmail") as string,
    phoneNumber: headersList.get("userPhoneNumber") as string,
  };
  if (isNaN(planId) || isNaN(user.id) || !user.email || !user.phoneNumber) {
    return redirect("/dashboard/payment");
  }

  let price: number;
  try {
    const webPlan = await prisma.webPlans.findUnique({
      where: { id: planId },
      select: { price: true },
    });
    if (!webPlan || !webPlan.price) throw new Error("PlanNotFound");

    price = webPlan.price;
  } catch {
    return redirect("/dashboard/payment");
  }

  const paymentPayload = {
    merchant_id: process.env.ZARINPAL_MERCHANT_ID,
    amount: price,
    callback_url:
      process.env.ZARINPAL_CALLBACK_URL ||
      "http://localhost:3000/api/verify-payment",
    description: `پلن ${planId}`,
    metadata: {
      mobile: user.phoneNumber,
      email: user.email,
    },
  };
  const paymentResponse = await fetch(
    "https://payment.zarinpal.com/pg/v4/payment/request.json",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(paymentPayload),
    },
  );

  const paymentData = await paymentResponse.json();
  if (paymentData.data.code !== 100) {
    console.error("Payment request failed", paymentData);
    return redirect("/dashboard/payment");
  }

  return redirect(
    `https://payment.zarinpal.com/pg/StartPay/${paymentData.data.authority}`,
  );
}
