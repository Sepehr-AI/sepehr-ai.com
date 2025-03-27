import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SepehrAiJwtPayload } from "./app/auth/lib";
import MultiStepLimiter from "./lib/MultiStepLimiter";
import { genUnauthorizedRes, UnauthorizedReason } from "./lib/chatErrors";

const E403 = `<!DOCTYPE html>
<html lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بیش از حد درخواست</title>
  <style>
    body {
      direction: rtl;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: Tahoma, sans-serif;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      margin-bottom: 1rem;
      font-size: 2rem;
      color: #cd3d3d;
    }
    p {
      margin: 0;
      font-size: 1.2rem;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>تعداد درخواست بیش از حد!</h1>
    <p>لطفاً چند دقیقه بعد دوباره تلاش کنید.</p>
  </div>
</body>
</html>
`;

const ipLimiter = new MultiStepLimiter([
  {
    points: 10,
    duration: 1,
  },
  {
    points: 100,
    duration: 60,
  },
  {
    points: 100,
    duration: 60 * 60 * 24,
  },
]);

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface MiddlewareUserData {
  id: number;
  email: string;
  webBalance: number;
  mobile: string;
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
    select: { webBalance: true, email: true, mobile: true },
  });
  if (!user) throw new Error("UserNotFound");

  return { id: userId, ...user };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).ip ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-client-ip") ||
    "unknown";
  try {
    if (process.env.NODE_ENV === "production") await ipLimiter.consume(ip);
  } catch {
    if (!pathname.startsWith("/api")) {
      const res = new Response(E403);
      res.headers.set("Content-Type", "text/html; charset=utf-8");
      return res;
    } else {
      return NextResponse.json(
        { error: "Too many requests!" },
        { status: 429 }
      );
    }
  }

  let user: MiddlewareUserData | undefined = undefined;
  if (pathname.startsWith("/dashboard")) {
    try {
      user = await authenticate(req);
    } catch {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  } else if (pathname.startsWith("/api/chat")) {
    try {
      user = await authenticate(req);
    } catch (_e: unknown) {
      switch ((_e as Error).message) {
        case "TokenNotSet":
          return genUnauthorizedRes(UnauthorizedReason.COOKIE_NOT_SET);
        case "InvalidJwt":
          return genUnauthorizedRes(UnauthorizedReason.JWT_NOT_VALID);
        case "UserNotFound":
          return genUnauthorizedRes(UnauthorizedReason.USER_NOT_FOUND);
        default:
          return genUnauthorizedRes(UnauthorizedReason.UNAUTH);
      }
    }
  }

  const headers = new Headers(req.headers);
  if (user) {
    headers.set("userEmail", user.email);
    headers.set("usermobile", user.mobile);
    headers.set("userId", user.id.toString() as string);
    headers.set("userWebBalance", user.webBalance.toString() as string);
  }
  if (pathname.startsWith("/auth")) headers.set("x-client-ip", ip);

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  runtime: "nodejs",
  // matcher: ["/dashboard", "/dashboard/:path"],
};
