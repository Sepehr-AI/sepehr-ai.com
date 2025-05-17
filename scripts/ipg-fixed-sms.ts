import readline from "readline";
import prisma from "@/lib/prisma";
import { sepehrFetchWithLogger } from "@/sepehr-ai-ipg/src/lib";

const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY;
if (!SMS_IR_API_KEY) {
  console.error(
    "Error: SMS_IR_API_KEY is not defined in environment variables.",
  );
  process.exit(1);
}

const sepehrFetch = sepehrFetchWithLogger((obj, msg) =>
  console.error(msg, obj),
);

async function main() {
  // Fetch all users
  // const allUsers = [{ name: "مهدی شریفی", mobile: "09150872550" }];
  const allUsers = await prisma.user.findMany({
    select: { name: true, mobile: true },
  });

  // Filter where name is not equal to mobile
  const targets = allUsers.filter((u) => u.name !== u.mobile);
  const total = targets.length;

  console.log(`Found ${total} users.`);

  // Prompt user to proceed
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Proceed to send SMS to these users? (yes/no) ",
    async (answer) => {
      rl.close();
      const proceed = answer.trim().toLowerCase();
      if (proceed !== "yes" && proceed !== "y") {
        console.log("Aborting. No SMS sent.");
        await prisma.$disconnect();
        process.exit(0);
      }

      console.log("Starting to send SMS...");
      // Send SMS one by one and show progress
      for (let i = 0; i < targets.length; i++) {
        const user = targets[i];
        try {
          await sepehrFetch("https://api.sms.ir/v1/send/verify", {
            headers: {
              "x-api-key": SMS_IR_API_KEY,
            },
            body: {
              mobile: user.mobile,
              templateId: 292747,
              parameters: [
                { name: "name", value: user.name.split(" ")[0] || "کاربر" },
              ],
            },
          });

          console.log(`(${i + 1}/${total}) Sent SMS to ${user.mobile}`);
        } catch (error) {
          console.error(`Failed to send to ${user.mobile}:`, error);
        }
      }

      console.log("All messages processed.");
      await prisma.$disconnect();
      process.exit(0);
    },
  );
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  prisma.$disconnect();
  process.exit(1);
});
