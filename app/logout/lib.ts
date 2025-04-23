"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function handleServerLogout() {
  revalidatePath("/", "layout");

  let destination = "/";
  if (process.env.NODE_ENV === "production") {
    destination = process.env.NEXT_PUBLIC_BASE_URL || "/";
  }

  // Clear the session cookie explicitly. Generally this can be done by just
  // using Set-Cookie: <cookie-name>=; but Next.js gives us an API to do it.
  (await cookies()).delete("token");

  return NextResponse.redirect(destination, {
    headers: {
      "Clear-Site-Data": `"cache", "cookies"`,
      // Next.js accepts this directive to clear its own client fetch cache.
      "Cache-Control": "no-store",
    },
  });
}
