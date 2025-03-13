"use server";

import { permanentRedirect, redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { jwtVerify, SignJWT } from "jose";
import { User } from "@prisma/client";
import { chargeAccount } from "../dashboard/payment/actions";

const JWT_SECRET = process.env.JWT_SECRET as string;
const cookiesConfig = {
  path: "/",
  httpOnly: true,
  secure:
    (process.env.SECURE_COOKIES &&
      process.env.SECURE_COOKIES.toLowerCase() === "true") ||
    false,
  sameSite: (process.env.STRICT_COOKIES &&
  process.env.STRICT_COOKIES.toLowerCase() === "true"
    ? "strict"
    : "none") as "strict" | "none",
};

export interface AyarJwtPayload {
  id: number;
  name: string;
  email: string;
}

async function redirectToDashboard(user: User, selectedPlan?: number) {
  if (!selectedPlan) return redirect("/dashboard");

  return chargeAccount(user, selectedPlan);
}

/**
 * Server Action: Check whether a user with the provided email exists.
 * Redirects to `/auth` with the email and an "exists" flag.
 */
export async function checkEmailAction(
  formData: FormData,
  selectedPlan?: number
) {
  const email = formData.get("email")?.toString();
  if (!email) {
    // You could handle errors more gracefully
    return redirect(
      encodeURI(
        `/auth?${
          selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
        }error=ایمیل وارد نشده است!`
      )
    );
  }
  const user = await prisma.user.findUnique({ where: { email } });
  // Redirect with query parameters indicating the email and whether it exists
  redirect(
    encodeURI(
      `/auth?${
        selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
      }email=${encodeURIComponent(email)}&exists=${!!user}`
    )
  );
}

/**
 * Server Action: Log in the user.
 * On success, sets a JWT cookie and redirects to the dashboard.
 */
export async function loginAction(formData: FormData, selectedPlan?: number) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  if (!email || !password) {
    return redirect(
      encodeURI(
        `/auth${
          selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
        }?email=${encodeURIComponent(
          email || ""
        )}&exists=true&error=اطلاعات ورود ارسال نشده اند!`
      )
    );
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return redirect(
      encodeURI(
        `/auth?${
          selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
        }error=کاربر پیدا نشد!`
      )
    );
  }
  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return redirect(
      encodeURI(
        `/auth?${
          selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
        }email=${encodeURIComponent(
          email
        )}&exists=true&error=رمز عبور اشتباه است!`
      )
    );
  }
  // const token = jwt.sign(
  //   { id: user.id, email: user.email, name: user.name } as JwtPayload,
  //   JWT_SECRET,
  //   { expiresIn: "9999 years" }
  // );
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 60 * 60;
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
  })
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .setExpirationTime(exp)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(new TextEncoder().encode(JWT_SECRET));

  (await cookies()).set("token", token, cookiesConfig);

  return redirectToDashboard(user, selectedPlan);
}

/**
 * Server Action: Register a new user.
 * On success, creates the user, sets a JWT cookie, and redirects to the dashboard.
 */
export async function registerAction(
  formData: FormData,
  selectedPlan?: number
) {
  const email = formData.get("email")?.toString();
  const name = formData.get("userName")?.toString();
  const password = formData.get("password")?.toString();
  const phoneNumber = formData.get("phoneNumber")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  if (!name || !email || !password || !confirmPassword || !phoneNumber) {
    return redirect(
      encodeURI(
        `/auth?${
          selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
        }email=${encodeURIComponent(
          email || ""
        )}&exists=false&error=فیلد های لازم ارسال نشده اند!`
      )
    );
  }
  if (!RegExp(/((0?9)|(\+?989))\d{9}/g).test(phoneNumber)) {
    return redirect(
      encodeURI(
        `/auth?${
          selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
        }email=${encodeURIComponent(
          email || ""
        )}&exists=false&error=شماره موبایل وارد شده اشتباه است!`
      )
    );
  }
  if (password !== confirmPassword) {
    return redirect(
      encodeURI(
        `/auth?${
          selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
        }email=${encodeURIComponent(
          email
        )}&exists=false&error=رمز عبور با تکرارش برابر نیست!`
      )
    );
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return redirect(
      encodeURI(
        `/auth?${
          selectedPlan ? `selectedPlan=${selectedPlan}&` : ""
        }email=${encodeURIComponent(email)}&exists=true&error=کاربر وجود دارد!`
      )
    );
  }
  const hashedPassword = await bcrypt.hash(
    password,
    Number(process.env.BYCRYPT_ROUNDS || 0)
  );
  const user = await prisma.user.create({
    data: { email, phoneNumber, name, password: hashedPassword },
  });
  // const token = jwt.sign(
  //   { id: user.id, email: user.email, name: user.name } as JwtPayload,
  //   JWT_SECRET,
  //   { expiresIn: "9999 years" }
  // );
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 60 * 60;
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
  })
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .setExpirationTime(exp)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(new TextEncoder().encode(JWT_SECRET));
  (await cookies()).set("token", token, cookiesConfig);

  return redirectToDashboard(user, selectedPlan);
}

export async function isUserAuth(): Promise<boolean> {
  return (await cookies()).get("token")?.value ? true : false;
}

export async function redirectToDashboardIfUserAuth() {
  if (await isUserAuth()) return permanentRedirect("/dashboard");
}

export async function userIsAuthOrRedirect() {
  if (!(await isUserAuth())) return permanentRedirect("/");
}

export async function getUserPayload(): Promise<AyarJwtPayload> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return permanentRedirect("/");

  return (await jwtVerify(token, new TextEncoder().encode(JWT_SECRET)))
    .payload as unknown as AyarJwtPayload;
}
