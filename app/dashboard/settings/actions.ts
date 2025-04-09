"use server";

import bcrypt from "bcrypt";
import { warn } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  const headersList = await headers();
  const userId = Number(headersList.get("userId") || "abc");
  if (
    newPassword !== confirmPassword ||
    newPassword === currentPassword ||
    isNaN(userId)
  ) {
    return;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(
          newPassword,
          Number(process.env.BYCRYPT_ROUNDS || 0)
        ),
      },
    });
  } catch (e) {
    warn("Failed to update user's password.", { error: e, userId });
  }
}
