import { z } from "zod";
import dotenv from "dotenv";
import readline from "readline";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/openrouterApiKey";
import { sepehrFetch } from "@/sepehr-ai-ipg/src/lib";

dotenv.config();

const AES_ENCRYPTION_MASTERKEY: Buffer = Buffer.from(
  process.env.AES_ENCRYPTION_MASTERKEY as string,
  "hex",
);

// Schema for GET /api/v1/key
const getKeySchema = z.object({
  data: z.object({
    label: z.string(),
    limit: z.number(),
    usage: z.number(),
    is_free_tier: z.boolean(),
    limit_remaining: z.number().nullable(),
    is_provisioning_key: z.boolean(),
  }),
});

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise<string>((resolve) =>
    rl.question(question, resolve),
  );
  rl.close();
  return answer.trim();
}

async function main() {
  // 1. Prompt for user mobile & OpenRouter API key
  const userMobile = await prompt("Enter user mobile: ");
  const userApiKey = await prompt("Enter the user’s OpenRouter API key: ");

  // 2. Lookup the user
  const user = await prisma.user.findUnique({ where: { mobile: userMobile } });
  if (!user) {
    console.error(`❌ No user found with mobile ${userMobile}`);
    process.exit(1);
  }

  // 3. Verify the key by calling GET /api/v1/key
  console.log("📡 Verifying OpenRouter API key…");
  const [res, status, error] = await sepehrFetch(
    "https://openrouter.ai/api/v1/key",
    {
      method: "GET",
      schema: getKeySchema,
      headers: { Authorization: `Bearer ${userApiKey}` },
    },
  );
  if (error) {
    console.error({ status, data: res });
    throw new Error("Failed to retrieve API key metadata");
  }

  const { label, limit, limit_remaining } = res.data;
  const effectiveLimit = limit_remaining ?? limit;
  console.log(
    `→ Key label: ${label}, total limit: ${limit}, remaining: ${limit_remaining}`,
  );

  // 4. Encrypt the plaintext key
  const encryptedMeta = encrypt(userApiKey, AES_ENCRYPTION_MASTERKEY);

  // 5. Upsert into openrouterApiKey table
  await prisma.openrouterApiKey.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      hash: label,
      limit: effectiveLimit,
      metadata: encryptedMeta,
    },
    update: {
      hash: label,
      limit: effectiveLimit,
      metadata: encryptedMeta,
    },
  });

  console.log(
    `✅ Successfully registered key “${label}” for ${user.name} (${user.mobile})`,
  );
}

main()
  .catch((err) => {
    console.error("Error running script:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

/*
Usage:
  NODE_ENV=.env pnpm ts-node register-user-key.ts
*/
