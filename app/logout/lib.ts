"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function handleServerLogout(req: NextRequest) {
  revalidatePath("/", "layout");

  let destination = new URL("/", req.url);
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_BASE_URL
  ) {
    destination = new URL(process.env.NEXT_PUBLIC_BASE_URL);
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
