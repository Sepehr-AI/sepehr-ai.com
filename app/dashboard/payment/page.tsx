"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import PaymentLayout from "./Layout";
import { headers } from "next/headers";
import { usdToCredit } from "@/lib/cost";
import { getWebPlans } from "@/lib/plans";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/openrouterApiKey";
import { sepehrFetch } from "@/sepehr-ai-ipg/src/lib";

const AES_ENCRYPTION_MASTERKEY: Buffer = Buffer.from(
  process.env.AES_ENCRYPTION_MASTERKEY || "",
  "hex",
);

const openrouterGetKeyResSchema = z.object({
  data: z.object({
    usage: z.number(),
    limit: z.number(),
  }),
});

export default async function PaymentPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const headersList = await headers();
  const userId = Number(headersList.get("userId") || "abc");
  if (isNaN(userId)) redirect("/auth");

  const searchParams = await _searchParams;
  const plans = await getWebPlans();
  const balanceInsufficient: boolean =
    searchParams["balanceInsufficient"]?.toString().toLowerCase() === "true";

  let webBalance = 0;
  if (process.env.NODE_ENV === "production") {
    const res = await prisma.openrouterApiKey.findUnique({
      where: { userId },
      select: { metadata: true },
    });
    if (res) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [{ data }, _, error] = await sepehrFetch(
        "https://openrouter.ai/api/v1/key",
        {
          method: "GET",
          schema: openrouterGetKeyResSchema,
          headers: {
            Authorization: `Bearer ${decrypt(res.metadata, AES_ENCRYPTION_MASTERKEY)}`,
          },
        },
      );
      if (!error) {
        webBalance = usdToCredit(data.limit - data.usage);
      }
    }
  }

  return (
    <PaymentLayout
      plans={plans.reverse()}
      webBalance={webBalance}
      balanceInsufficient={balanceInsufficient}
    />
  );
}
