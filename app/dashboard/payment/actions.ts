"use server";

import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { MiddlewareUserData } from "@/middleware";
import getExchangeRate from "@/lib/exchange";

// Note: Make sure to use await headers()
// and that your environment variables (SEPHER_TERMINAL_ID and SEPHER_CALLBACK_URL)
// are correctly set. Also, see the note below regarding port 8081 restrictions.

export async function chargeAccountAction(formData: FormData) {
  const headersList = await headers();
  const planId = Number(formData.get("planId"));
  const user: MiddlewareUserData = {
    webBalance: 0,
    id: Number(headersList.get("userId")),
    email: headersList.get("userEmail") as string,
    mobile: headersList.get("usermobile") as string,
  };

  if (isNaN(planId) || isNaN(user.id) || !user.email || !user.mobile) {
    console.error("Unexpected:", { user });
    return redirect("/dashboard/payment");
  }

  return chargeAccount(user, planId);
}

export async function chargeAccount(user: MiddlewareUserData, planId: number) {
  let price: number;
  let usdAmount: number;
  const exchangeRate = await getExchangeRate();
  try {
    const webPlan = await prisma.webPlan.findUnique({
      where: { id: planId },
      select: { usdAmount: true },
    });
    if (!webPlan) throw new Error("PlanNotFound");
    usdAmount = webPlan.usdAmount;
    price = webPlan.usdAmount * exchangeRate;
  } catch (e) {
    console.error("Unexpected 2:", { planId, user, exchangeRate, e });
    return redirect("/dashboard/payment");
  }

  price = 10_000;

  // Create a new Transaction row using your Prisma model.
  // The auto-generated ID here is used as the invoice ID for the payment gateway.
  const transaction = await prisma.transaction.create({
    data: {
      usdAmount,
      exchangeRate,
      amount: price,
      user: { connect: { id: user.id } },
      // Other fields (exchangeRate, fee, refId, code) will be updated later.
    },
  });

  const invoiceID = transaction.id.toString(); // Use this as the InvoiceID

  // Build payload for the GetToken API of the new payment gateway.
  const paymentPayload = {
    TerminalID: process.env.SEPHER_TERMINAL_ID, // Ensure it is exactly 8 characters.
    Amount: price, // Price in Rial; check that it complies with minimum requirements.
    InvoiceID: invoiceID,
    callbackURL:
      process.env.SEPHER_CALLBACK_URL ||
      "http://localhost:3000/api/verify-payment",
    payload: `پلن ${planId} برای کاربر ${user.id}`,
  };

  try {
    // Send payment initiation (GetToken)
    const tokenResponse = await fetch(
      "https://sepehr.shaparak.ir/Rest/V1/PeymentApi/GetToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(paymentPayload),
      }
    );

    const tokenData = await tokenResponse.json();

    // A Status of 0 indicates success, as per the provider’s documentation.
    if (tokenData.Status !== 0 || !tokenData.Accesstoken) {
      console.error("Token request failed", tokenData);
      return redirect("/dashboard/payment");
    }

    // Redirect the customer to the payment gateway page.
    const paymentURL = `https://sepehr.shaparak.ir/Pay?token=${encodeURIComponent(
      tokenData.Accesstoken
    )}&terminalID=${encodeURIComponent(process.env.SEPHER_TERMINAL_ID || "")}`;

    return redirect(paymentURL);
  } catch (e) {
    console.error("Error during token request", e);
    return redirect("/dashboard/payment");
  }
}
