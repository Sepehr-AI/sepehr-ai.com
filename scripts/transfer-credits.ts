import { z } from "zod";
import dayjs from "dayjs";
import readline from "readline";
import prisma from "@/lib/prisma";
import utc from "dayjs/plugin/utc";
import { usdToCredit } from "@/lib/cost";
import timezone from "dayjs/plugin/timezone";
import { decrypt, encrypt } from "@/lib/openrouterApiKey";
import { sepehrFetchWithLogger } from "@/sepehr-ai-ipg/src/lib";

dayjs.extend(utc);
dayjs.extend(timezone);

const sepehrFetch = sepehrFetchWithLogger((obj, msg) =>
  console.error(msg, obj),
);

const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY as string;
const OPENROUTER_PROVISIONING_API_KEY = process.env
  .OPENROUTER_PROVISIONING_API_KEY as string;
const AES_ENCRYPTION_MASTERKEY: Buffer = Buffer.from(
  process.env.AES_ENCRYPTION_MASTERKEY as string,
  "hex",
);

const openrouterCreateKeyResSchema = z.object({
  key: z.string(),
  data: z.object({
    hash: z.string(),
    limit: z.number(),
    disabled: z.boolean(),
  }),
});
const openrouterUpdateKeyResSchema = z.object({
  data: z.object({
    limit: z.number(),
    key: z.string().optional(),
    hash: z.string().optional(),
    disabled: z.boolean().optional(),
  }),
});

async function main() {
  // Parse command-line flags
  const argv = process.argv.slice(2);
  const includeOlder = argv.includes("--all");

  // Determine yesterday's window in Asia/Tehran timezone
  const tehranNow = dayjs().tz("Asia/Tehran");
  const todayTehran = tehranNow.startOf("day");
  const yesterdayStart = todayTehran.subtract(1, "day");
  const yesterdayEnd = todayTehran;

  // Build Prisma where filter
  const where = includeOlder
    ? {
        respCode: 0,
        creditsTransferred: false,
        createdAt: { lte: yesterdayEnd.toDate() },
      }
    : {
        respCode: 0,
        creditsTransferred: false,
        createdAt: { gte: yesterdayStart.toDate(), lt: yesterdayEnd.toDate() },
      };

  // Fetch transactions with user data
  const transactions = await prisma.transaction.findMany({
    where,
    include: { user: true },
  });

  if (transactions.length === 0) {
    console.log("No pending transactions found.");
    return;
  }

  // Log each transaction and its user
  console.log("Pending transactions:");
  transactions.forEach((tx) => {
    console.log(
      `Transaction ID: ${tx.id}, User ID: ${tx.userId}, User full name: ${tx.user.name}, Mobile: ${tx.user.mobile}, USD Crdits: ${tx.usdCredits}, Created At: ${tx.createdAt.toISOString()}`,
    );
  });

  // Prompt for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise<string>((resolve) => {
    rl.question("Proceed with transferring credits? (y/N) ", resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== "y") {
    console.log("Aborted. No changes were made.");
    return;
  }

  // Process each transaction in parallel using Promise.all
  await Promise.all(
    transactions.map(async (t) => {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.openrouterApiKey.findUnique({
          where: { userId: t.userId },
          select: { id: true, hash: true, limit: true, metadata: true },
        });
        if (existing) {
          const [{ data }, status, error] = await sepehrFetch(
            `https://openrouter.ai/api/v1/keys/${existing.hash}`,
            {
              method: "PATCH",
              maximumRetries: 1,
              schema: openrouterUpdateKeyResSchema,
              headers: {
                Authorization: `Bearer ${OPENROUTER_PROVISIONING_API_KEY}`,
              },
              body: {
                limit: existing.limit + t.usdCredits,
              },
            },
          );
          if (error) {
            console.error({ status, data });
            throw new Error("Openrouter API key update failed!");
          }
          if (data.limit !== existing.limit + t.usdCredits) {
            console.error({ data });
            throw new Error(
              "Openrouter returned a different limit than what it was told!",
            );
          }
          const limit = data.limit;
          const hash = data.hash || existing.hash;
          const key =
            data.key || decrypt(existing.metadata, AES_ENCRYPTION_MASTERKEY);

          await tx.openrouterApiKey.update({
            where: { userId: t.userId },
            data: {
              hash,
              limit,
              metadata: encrypt(key, AES_ENCRYPTION_MASTERKEY),
            },
          });
        } else {
          const [{ data, key }, status, error] = await sepehrFetch(
            "https://openrouter.ai/api/v1/keys",
            {
              maximumRetries: 1,
              schema: openrouterCreateKeyResSchema,
              headers: {
                Authorization: `Bearer ${OPENROUTER_PROVISIONING_API_KEY}`,
              },
              body: {
                limit: t.usdCredits,
                name: String(t.userId),
              },
            },
          );
          if (error) {
            console.error({ status, data });
            throw new Error("Openrouter API key creation failed!");
          }
          if (data.limit !== t.usdCredits) {
            console.error({ data });
            throw new Error(
              "Openrouter returned a different limit than what it was told!",
            );
          }
          if (data.disabled) {
            console.error({ data });
            throw new Error("Openrouter created an API key that's disabed!");
          }

          await tx.openrouterApiKey.create({
            data: {
              hash: data.hash,
              userId: t.userId,
              limit: t.usdCredits,
              metadata: encrypt(key, AES_ENCRYPTION_MASTERKEY),
            },
          });
        }

        await tx.transaction.update({
          where: { id: t.id },
          data: { creditsTransferred: true },
        });
      });
      const user = await prisma.user.findUnique({
        where: { id: t.userId },
        select: { mobile: true },
      });
      if (!user) throw new Error("Unexpected user not found database error.");

      await sepehrFetch("https://api.sms.ir/v1/send/verify", {
        headers: {
          "x-api-key": SMS_IR_API_KEY,
        },
        body: {
          mobile: user.mobile,
          templateId: 857554,
          parameters: [
            {
              name: "Credits",
              value: usdToCredit(t.usdCredits),
            },
          ],
        },
      });
      console.log(`Processed transaction ${t.id}`);
    }),
  );

  console.log("All transactions processed successfully.");
}

main()
  .catch((err) => {
    console.error("Error running script:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

// Usage:
//   pnpm run transfer-credits [--all]
//   --all  Include transactions from yesterday and earlier (Tehran time)
