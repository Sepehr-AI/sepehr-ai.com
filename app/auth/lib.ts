/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import dayjs from "dayjs";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import utc from "dayjs/plugin/utc";
import { randomInt } from "node:crypto";
import type { User } from "@/prisma/client";
import timezone from "dayjs/plugin/timezone";
import { hash, verify } from "@node-rs/argon2";
import { cookies, headers } from "next/headers";
import { error, errorOnThrow } from "@/lib/log";
import MultiStepLimiter from "@/lib/MultiStepLimiter";
import { findOrCreateOtp } from "@/prisma/client/sql";
import { redirect } from "next/navigation";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { PrismaClientKnownRequestError } from "@/prisma/client/runtime/library";
import {
  checkMobileFormSchema,
  loginFormSchema,
  registerFormSchema,
} from "./validationSchema";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Tehran");

const JWT_SECRET = process.env.JWT_SECRET as string;
const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY as string;
const ARGON2_SECRET_BUF = Buffer.from(
  process.env.ARGON2_SECRET as string,
  "utf-8",
);
const cookiesConfig: Partial<ResponseCookie> = {
  path: "/",
  ...(process.env.NODE_ENV === "production"
    ? {
        secure: true,
        sameSite: "strict",
        domain: "sepehr-ai.com",
        expires: dayjs().tz("Asia/Tehran").add(30, "day").toDate(),
      }
    : {}),
};

export interface SepehrAiJwtPayload {
  id: number;
  name: string;
  mobile: string;
}

/**
 * Redirect helper that builds a query string from an object.
 * It loops through the keys and values and appends them as query parameters.
 */
function redirectWithParams(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
) {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    if (params[key]) searchParams.set(key, params[key].toString());
  }
  return redirect(`${path}?${searchParams.toString()}`);
}

async function redirectToDashboard(selectedPlan?: number) {
  return redirectWithParams("/dashboard", { selectedPlan });
}

async function getClientIp() {
  const headersList = await headers();

  return headersList.get("x-client-ip") || "unknown";
}
async function redirectTo429(untilNextReq: number) {
  return redirectWithParams("/auth/429", { untilNextReq });
}

const otpLimiter = new MultiStepLimiter([
  // {
  //   points: 2,
  //   duration: 60,
  // },
  // {
  //   points: 5,
  //   duration: 60 * 60,
  // },
  { points: 100, duration: 60 * 60 * 24 },
]);
export async function checkMobileAction(
  formData: FormData,
  selectedPlan?: number,
) {
  const ip = await getClientIp();
  let mobile = formData.get("mobile")?.toString();
  try {
    await otpLimiter.consume(ip);
    if (mobile) await otpLimiter.consume(mobile);
  } catch (e: any) {
    return redirectTo429(e.msBeforeNext);
  }

  const validationResult = await checkMobileFormSchema.spa(
    Object.fromEntries(formData),
  );
  mobile = validationResult.data?.mobile as string;

  const authResp = (
    error?: string,
    exists: boolean = false,
    mobile?: string,
    userId?: number,
  ) => {
    return redirectWithParams("/auth", {
      error,
      userId,
      mobile,
      exists,
      selectedPlan,
    });
  };

  if (!validationResult.success) {
    return authResp(validationResult.error.issues[0].message, false);
  }

  const user = await errorOnThrow("upsertingInAuthCheckMobile", () =>
    prisma.user.upsert({
      update: {},
      where: { mobile },
      select: { id: true, name: true },
      create: {
        mobile,
        name: mobile,
      },
    }),
  );
  const userExists = user.name !== mobile;

  const { error: sendOtpErr } = await sendOtp(mobile);
  if (sendOtpErr) return authResp(sendOtpErr, userExists);

  return authResp(undefined, userExists, mobile, user.id);
}

async function setTokenCookie(user: User) {
  const iat = dayjs().tz("Asia/Tehran").unix();
  const exp = dayjs()
    .tz("Asia/Tehran")
    .add(60 * 60 * 60 * 60, "second")
    .unix();
  const token = await errorOnThrow("settingTokenCookieInAuthLogin", () =>
    new SignJWT({
      id: user.id,
      name: user.name,
      mobile: user.mobile,
    })
      .setIssuedAt(iat)
      .setNotBefore(iat)
      .setExpirationTime(exp)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .sign(new TextEncoder().encode(JWT_SECRET)),
  );

  await errorOnThrow("settingTokenCookieInAuthLogin", async () =>
    (await cookies()).set("token", token, cookiesConfig),
  );
}

async function sendOtp(mobile: string): Promise<{ error?: string }> {
  const otp = randomInt(100000, 999999);
  const otpHashed = await errorOnThrow("OtpHashingInAuth", () =>
    hash(otp.toString(), {
      secret: ARGON2_SECRET_BUF,
    }),
  );

  const gotten = await errorOnThrow("findOrCreateOtpRawQueryInAuth", () =>
    prisma.$queryRawTyped(findOrCreateOtp(mobile, otpHashed)),
  );
  if (!gotten.length) {
    return { error: "برای ارسال مجدد کد تایید باید حداقل دو دقیقه صبر کنید." };
  }

  if (process.env.NODE_ENV === "production") {
    const otpSendRes = await errorOnThrow("OtpHashingInAuth", () =>
      fetch("https://api.sms.ir/v1/send/verify", {
        method: "POST",
        headers: {
          Accept: "text/plain",
          "x-api-key": SMS_IR_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile,
          templateId: 872172,
          parameters: [
            {
              name: "Code",
              value: otp,
            },
          ],
        }),
      }),
    );
    if (otpSendRes.status !== 200) {
      error("OtpSmsUnexpectedApiResponse", {
        status: otpSendRes.status,
        body: await otpSendRes.json(),
      });
      return { error: "خطای غیر منتظره. ارسال پیامک موفقیت آمیز نبود!" };
    }
  } else {
    console.log({ mobile, otp });
  }

  return {};
}

async function verifyOtp(
  otp: string | number,
  userId: string | number,
): Promise<{ error?: string }> {
  userId = Number(userId);
  const dbOpt = await errorOnThrow("findingOptInAuthLogin", () =>
    prisma.otp.findUnique({
      where: { userId },
      select: { code: true, createdAt: true },
    }),
  );

  if (!dbOpt) return { error: "کد تاییدی ارسال نشده!" };
  if (
    dayjs(dbOpt.createdAt)
      .tz("Asia/Tehran")
      .isBefore(dayjs().tz("Asia/Tehran").subtract(3, "minute"))
  ) {
    return {
      error:
        "کد های تایید برای سه دقیقه قابل استفاده هستند. لطفا به صفحه قبل برگردید و مجددا درخواست کد تایید کنید.",
    };
  }
  if (
    !(await errorOnThrow("verifyingOtpInAuthLogin", () =>
      verify(dbOpt.code, String(otp), { secret: ARGON2_SECRET_BUF }),
    ))
  ) {
    return { error: "کد تایید اشتباه است!" };
  }

  await errorOnThrow("deletingOptInAuthLogin", () =>
    prisma.otp.delete({
      where: { userId },
    }),
  );

  return {};
}

const loginAndRegisterLimiter = new MultiStepLimiter([
  {
    points: 10,
    duration: 60,
  },
  {
    points: 40,
    duration: 60 * 60 * 24,
  },
]);

export async function loginAction(formData: FormData, selectedPlan?: number) {
  try {
    await loginAndRegisterLimiter.consume(await getClientIp());
  } catch (e: any) {
    return redirectTo429(e.msBeforeNext);
  }

  const validationResult = await loginFormSchema.spa(
    Object.fromEntries(formData),
  );
  const otp = formData.get("otp")?.toString();
  let userId: number | string | undefined = formData.get("userId")?.toString();
  const mobile = formData.get("mobile")?.toString();

  const authErr = (error: string) => {
    return redirectWithParams("/auth", {
      error,
      userId,
      mobile,
      exists: true,
      selectedPlan,
    });
  };

  if (!validationResult.success) {
    return authErr(validationResult.error.issues[0].message);
  }

  const { error: otpVerifyErr } = await verifyOtp(
    otp as string,
    userId as string,
  );
  if (otpVerifyErr) return authErr(otpVerifyErr);

  userId = Number(userId);
  const user = await errorOnThrow("findingUserInAuthLogin", () =>
    prisma.user.findUnique({
      select: { id: true, mobile: true, name: true },
      where: { id: userId },
    }),
  );
  if (!user) return authErr("کاربر پیدا نشد!");

  await setTokenCookie(user);
  return redirectToDashboard(selectedPlan);
}

export async function registerAction(
  formData: FormData,
  selectedPlan?: number,
) {
  try {
    await loginAndRegisterLimiter.consume(await getClientIp());
  } catch (e: any) {
    return redirectTo429(e.msBeforeNext);
  }

  let email = formData.get("email")?.toString();
  if (!email?.length) formData.delete("email");

  const validationResult = await registerFormSchema.spa(
    Object.fromEntries(formData),
  );
  email = validationResult.data?.email;
  const otp = formData.get("otp")?.toString();
  const mobile = formData.get("mobile")?.toString();
  const fullName = formData.get("fullName")?.toString();
  const userId: string | number | undefined = formData
    .get("userId")
    ?.toString();

  const authErr = (error: string) => {
    return redirectWithParams("/auth", {
      otp,
      error,
      email,
      userId,
      mobile,
      fullName,
      selectedPlan,
      exists: false,
    });
  };

  if (!validationResult.success) {
    return authErr(validationResult.error.issues[0].message);
  }

  const { error: otpVerifyErr } = await verifyOtp(
    otp as string,
    userId as string,
  );
  if (otpVerifyErr) return authErr(otpVerifyErr);

  let user;
  const userData = { mobile, name: fullName, email };
  try {
    user = await prisma.user.upsert({
      create: userData,
      where: { mobile },
      update: {
        ...userData,
        mobile: undefined,
      },
    });
  } catch (e: unknown) {
    let errorMsg = "خطای غیر منتظره. در صورت تکرار به پشتیبانی گزارش کنید.";
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        errorMsg = "کاربری قبلا با این ایمیل ثبت‌ نام کرده است!";
      } else {
        error("UnexpectedRegisterationError", { e, userData });
      }
    } else {
      error("UnexpectedRegisterationPrismaError", { e, userData });
    }

    return authErr(errorMsg);
  }

  await setTokenCookie(user);
  return redirectToDashboard(selectedPlan);
}

export async function isUserAuth(): Promise<boolean> {
  return (await cookies()).get("token")?.value ? true : false;
}

export async function redirectToDashboardIfUserAuth() {
  if (await isUserAuth()) return redirect("/dashboard");
}

export async function userIsAuthOrRedirect() {
  if (!(await isUserAuth())) return redirect("/");
}
