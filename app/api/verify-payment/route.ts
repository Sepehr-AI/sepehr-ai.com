/* eslint-disable @typescript-eslint/no-explicit-any */
import { sendInfoNotice } from "@/lib/emailNotitifer";
import { error } from "@/lib/log";
import prisma from "@/lib/prisma";
import { findTransactionForUpdate } from "@/prisma/client/sql";
import {
  sepehrAiVerifyPaymentPayloadSchema,
  sepehrAiVerifyPaymentResSchema,
} from "@/sepehr-ai-ipg/src/lib";
import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";

const localIPs = ["127.0.0.1", "::1"];

export async function POST(
  req: NextRequest,
): Promise<NextResponse<z.infer<typeof sepehrAiVerifyPaymentResSchema>>> {
  let ip = req.headers.get("x-forwarded-for") || (req as any).ip || "unknown";
  // If there are multiple IPs (common when behind proxies), take the first one.
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // Normalize the IP address if needed (for example, removing IPv6 prefix from IPv4 addresses)
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  if (!localIPs.includes(ip)) {
    return NextResponse.json(
      {
        error: "Forbidden!",
      },
      { status: 403 },
    );
  }

  let json;
  let parsed;
  try {
    json = await req.json();
    parsed = await sepehrAiVerifyPaymentPayloadSchema.safeParseAsync(json);

    if (!parsed.success) throw new Error("Invalid payload!");
  } catch (e: any) {
    let msg = e;
    if (typeof e.toString === "function") msg = e.toString();

    return NextResponse.json(
      {
        error: msg,
        zodErrors: parsed?.error?.flatten(),
      },
      { status: 400 },
    );
  }
  const {
    rrn,
    amount,
    Status: ipgStatus,
    Message: message,
    respcode: respCode,
    ReturnId: returnId,
    invoiceid: _invoiceid,
    cardnumber: cardNumber,
    tracenumber: traceNumber,
    digitalreceipt: digitalReceipt,
  } = parsed.data;
  const transactionUpdateData = {
    rrn,
    message,
    returnId,
    respCode,
    cardNumber,
    traceNumber,
    digitalReceipt,
    status: ipgStatus,
  };

  let status: number = 500;
  const invoiceid = Number(_invoiceid);
  let dbAmount: number | undefined = undefined;
  try {
    await prisma.$transaction(async (tx) => {
      const findTransactionRes = await tx.$queryRawTyped(
        findTransactionForUpdate(invoiceid),
      );
      if (!findTransactionRes.length || !findTransactionRes[0].amount) {
        status = 404;
        throw new Error("Transaction not found!");
      }

      const transaction = findTransactionRes[0];
      if (Number(amount) !== Number(transaction.amount)) {
        status = 402;
        dbAmount = transaction.amount;
        throw new Error("Unmatching amount for transaction!");
      }
      if (transaction.respCode) {
        status = 202;
        throw new Error("Nothing to do!");
      }

      const res = await tx.transaction.update({
        where: { id: invoiceid },
        data: transactionUpdateData,
      });
      if (res.respCode === 0) sendInfoNotice("New customer", res);
    });
  } catch (e: any) {
    error("UnexpectedPrismaErrorInVerifyPayment", { error: e, dbAmount });
    return NextResponse.json(
      { error: e.toString(), dbAmount },
      { status: status },
    );
  }

  return NextResponse.json({}, { status: 200 });
}
