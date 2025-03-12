import { error } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  let authority;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("Status");
    authority = searchParams.get("Authority");

    // The transaction was canceled or failed.
    if (status !== "OK" || !authority) throw new Error("FailedTransaction");
  } catch {
    return NextResponse.redirect("/payment?error=transaction_failed");
  }

  let price: number;
  try {
    const webPlan = await prisma.webPlans.findUnique({
      // TODO: FIX THIS
      where: { id: 0 },
      select: { price: true },
    });
    if (!webPlan || !webPlan.price) throw new Error("PlanNotFound");

    price = webPlan.price;
  } catch {
    return NextResponse.redirect("/payment?error=transaction_failed");
  }

  // Prepare the payload for verification.
  const verifyPayload = {
    merchant_id: process.env.ZARINPAL_MERCHANT_ID,
    amount: price,
    authority,
  };

  try {
    // Call ZarinPal's verify API.
    const verifyResponse = await fetch(
      "https://payment.zarinpal.com/pg/v4/payment/verify.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(verifyPayload),
      },
    );

    const verifyData = await verifyResponse.json();

    // Check for a successful verification: code 100 means success, code 101 means already verified.
    if (verifyData.data.code === 100 || verifyData.data.code === 101) {
      // Payment is successful.
      // You can update the order status in your DB here and show the transaction ref_id.
      return NextResponse.redirect(
        `/payment/success?ref_id=${verifyData.data.ref_id}`,
      );
    } else {
      console.error("Verification failed", verifyData);
      return NextResponse.redirect("/payment?error=verification_failed");
    }
  } catch (e) {
    error("Error during payment verification.", { error: e });
    return NextResponse.redirect("/payment?error=server_error");
  }
}
