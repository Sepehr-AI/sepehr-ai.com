import { error } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  let digitalreceipt;
  let invoiceID;

  try {
    const { searchParams } = new URL(request.url);
    // Assume the gateway returns “digitalreceipt” and “invoiceID” as query parameters.
    digitalreceipt = searchParams.get("digitalreceipt");
    invoiceID = searchParams.get("invoiceID");
    if (!digitalreceipt || !invoiceID) {
      throw new Error("Missing parameters");
    }
  } catch {
    return NextResponse.redirect("/payment?error=transaction_failed");
  }

  // Look up the transaction using the invoiceID (which is the Transaction row’s id)
  let transaction;
  try {
    transaction = await prisma.transaction.findUnique({
      where: { id: Number(invoiceID) },
    });
    if (!transaction) throw new Error("Transaction not found");
  } catch {
    return NextResponse.redirect("/payment?error=transaction_not_found");
  }

  // Build payload for the Advice (verification) API.
  const advicePayload = {
    digitalreceipt: digitalreceipt,
    Tid: process.env.SEPHER_TERMINAL_ID,
  };

  try {
    const adviceResponse = await fetch(
      "https://sepehr.shaparak.ir/Rest/V1/PeymentApi/Advice",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(advicePayload),
      }
    );

    const adviceData = await adviceResponse.json();

    // Successful verification should return Status "Ok"
    if (adviceData.Status === "Ok") {
      // Update the transaction with details from the Advice response.
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          refId: Number(adviceData.ReturnId) || null, // Adjust if ReturnId is not numeric
          code: 0, // Set a success code (adjust if needed)
          // You can update additional fields like exchangeRate or fee if provided.
        },
      });
      return NextResponse.redirect(
        `/payment/success?ref_id=${encodeURIComponent(adviceData.ReturnId)}`
      );
    } else {
      console.error("Advice verification failed", adviceData);
      return NextResponse.redirect("/payment?error=verification_failed");
    }
  } catch (e) {
    error("Error during payment verification.", { error: e });
    return NextResponse.redirect("/payment?error=server_error");
  }
}
