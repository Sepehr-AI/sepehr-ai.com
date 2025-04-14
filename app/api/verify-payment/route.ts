import { NextRequest } from "next/server";

interface SepehrAiVerifyPaymentPayload {
  status: string;
  invoiceId: string;
  reason: string | null;
}

export async function GET(request: NextRequest) {}
