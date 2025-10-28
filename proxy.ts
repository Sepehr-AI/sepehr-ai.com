import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { SepehrAiJwtPayload } from "./app/auth/lib";
import { handleServerLogout } from "./app/logout/lib";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface MiddlewareUserData {
  id: number;
  mobile: string;
  balance: number;
  email: string | null;
}

function respondError(status: number) {
  return NextResponse.json({ status }, { status });
}

async function authenticate(req: NextRequest): Promise<MiddlewareUserData> {
  const token = req.cookies.get("token")?.value;
  if (!token) throw new Error("TokenNotSet");

  const userId = (
    (await jwtVerify(token, new TextEncoder().encode(JWT_SECRET)))
      .payload as unknown as SepehrAiJwtPayload
  ).id;
  if (!userId) throw new Error("InvalidJwt");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, mobile: true, balance: true },
  });
  if (!user) throw new Error("UserNotFound");

  return { id: userId, ...user };
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let user: MiddlewareUserData | undefined = undefined;
  if (pathname.startsWith("/dashboard")) {
    try {
      user = await authenticate(req);
    } catch {
      return handleServerLogout();
    }
  } else if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/verify-payment")
  ) {
    try {
      user = await authenticate(req);
    } catch {
      return respondError(403);
    }
  }

  const headers = new Headers(req.headers);
  if (user) {
    headers.set("usermobile", user.mobile);
    headers.set("userEmail", user.email || "");
    headers.set("userBalance", user.balance.toString());
    headers.set("userId", user.id.toString() as string);
  }

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
