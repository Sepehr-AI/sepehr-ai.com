import { usdToCredit } from "@/lib/cost";
import prisma from "@/lib/prisma";
import { sepehrFetch } from "@/sepehr-ai-ipg/src/lib";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import dotenv from "dotenv";
import readline from "readline";

dayjs.extend(utc);
dayjs.extend(timezone);

dotenv.config();

const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY as string;

async function main() {
  // Parse command-line flags
  const argv = process.argv.slice(3);
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
      `Transaction ID: ${tx.id}, User ID: ${tx.userId}, User full name: ${tx.user.name}, Mobile: ${tx.user.mobile}, USD Credits: ${tx.usdCredits}, Created At: ${tx.createdAt.toISOString()}`,
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
        await tx.user.update({
          where: { id: t.userId },
          data: { balance: { increment: t.usdCredits } },
        });

        // Mark transaction as processed
        await tx.transaction.update({
          where: { id: t.id },
          data: { creditsTransferred: true },
        });
      });

      // Fetch user mobile for SMS notification
      const user = await prisma.user.findUnique({
        where: { id: t.userId },
        select: { mobile: true },
      });
      if (!user) throw new Error("Unexpected user not found database error.");

      // Send SMS notification
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
// --all  Include transactions from yesterday and earlier (Tehran time)
