"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  (await cookies()).delete("token");

  return NextResponse.redirect(new URL("/", request.url));
}
