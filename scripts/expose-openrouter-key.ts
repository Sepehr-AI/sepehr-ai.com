import readline from "readline";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/openrouterApiKey";

const AES_ENCRYPTION_MASTERKEY = Buffer.from(
  process.env.AES_ENCRYPTION_MASTERKEY as string,
  "hex",
);

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const mobile = await new Promise<string>((resolve) => {
    rl.question("Enter user mobile number: ", resolve);
  });
  rl.close();

  // Find user by mobile
  const user = await prisma.user.findUnique({
    where: { mobile },
    select: { id: true },
  });

  if (!user || !user.id) {
    console.error(`No user found with mobile ${mobile}`);
    process.exit(1);
  }

  const openrouterApiKey = await prisma.openrouterApiKey.findUnique({
    where: { userId: user.id },
    select: { limit: true, hash: true, metadata: true },
  });

  if (!openrouterApiKey || !openrouterApiKey.hash) {
    console.error(`User ${mobile} has no Openrouter API key record.`);
    process.exit(1);
  }

  // Decrypt the stored metadata to get the API key
  const decryptedKey = decrypt(
    openrouterApiKey.metadata,
    AES_ENCRYPTION_MASTERKEY,
  );

  console.log(`Openrouter API Key for user ${mobile}: ${decryptedKey}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error fetching API key:", err);
  process.exit(1);
});
