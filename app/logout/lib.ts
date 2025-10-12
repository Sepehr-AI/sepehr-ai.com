"use server";

import { NEXT_PUBLIC_BASE_URL } from "@/lib/url";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function handleServerLogout() {
  revalidatePath("/", "layout");

  // Clear the session cookie explicitly. Generally this can be done by just
  // using Set-Cookie: <cookie-name>=; but Next.js gives us an API to do it.
  (await cookies()).delete("token");

  return NextResponse.redirect(NEXT_PUBLIC_BASE_URL, {
    headers: {
      "Clear-Site-Data": `"cookies"`,
      // Next.js accepts this directive to clear its own client fetch cache.
      "Cache-Control": "no-store",
    },
  });
}
