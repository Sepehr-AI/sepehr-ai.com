/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  checkMobileFormSchema,
  loginFormSchema,
  registerFormSchema,
} from "./validationSchema";
import ValidatedInput from "../components/ValidatedInput";

export default function AuthLayout({
  otp,
  error,
  login,
  email,
  userId,
  mobile,
  exists,
  fullName,
  register,
  checkMobile,
}: {
  otp?: string;
  error?: string;
  email?: string;
  userId?: string;
  mobile?: string;
  exists?: string;
  fullName?: string;
  selectedPlan?: number;
  login: (_prev: any, formData: FormData) => Promise<never>;
  register: (_prev: any, formData: FormData) => Promise<never>;
  checkMobile: (_prev: any, formData: FormData) => Promise<never>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_1, action, _2] = useActionState<any, FormData>(
    !mobile ? checkMobile : exists === "true" ? login : register,
    {}
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    if (!(formData.get("email")?.toString() || "").length) {
      formData.delete("email");
    }

    const validationResult = (
      !mobile
        ? checkMobileFormSchema
        : exists === "true"
        ? loginFormSchema
        : registerFormSchema
    ).safeParse(Object.fromEntries(formData));
    if (!validationResult.success) {
      event.preventDefault();
      const firstMessage = validationResult.error.issues[0].message;
      toast.error(firstMessage, {
        position: "top-center",
        toastId: firstMessage,
      });
    }
  };

  useEffect(() => {
    if (error) toast.error(error, { position: "top-center", toastId: error });
  }, [error]);

  // Step 1: Mobile entry form (if no mobile query parameter exists)
  if (!mobile) {
    return (
      <div
        className="w-full h-dvh flex justify-center flex-col content-center max-w-md mx-auto p-6 bg-white text-center"
        dir="rtl"
      >
        <div className="shadow-2xl shadow-gray-800 p-8 rounded-md">
          <h2 className="text-2xl font-bold mb-6">
            شماره تلفن خود را وارد کنید
          </h2>
          <form action={action} onSubmit={handleSubmit} noValidate>
            <ValidatedInput
              required
              dir="ltr"
              type="text"
              name="mobile"
              align="left"
              placeholder="0912xxxxxxx"
              convertFarsiNumbersToEnglish={true}
              className="ltr w-full px-4 py-2 border border-gray-300 rounded mb-4"
            />
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded transition-colors"
            >
              ادامه
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 2A: Login form (if the mobile exists)
  if (exists === "true") {
    return (
      <div
        className="w-full h-dvh flex flex-col justify-center content-center max-w-md mx-auto p-6 bg-white rounded-md text-center"
        dir="rtl"
      >
        <div className="shadow-2xl shadow-gray-800 p-8 rounded-md">
          <h2 className="text-2xl font-bold mb-4">خوش آمدید!</h2>
          <form action={action} onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="mobile" value={mobile} />
            <input type="hidden" name="userId" value={userId} />
            <p className="mb-4">شماره تلفن: {mobile}</p>
            <ValidatedInput
              required
              name="otp"
              dir="ltr"
              value={otp}
              type="text"
              align="center"
              placeholder="کد تایید"
              convertFarsiNumbersToEnglish={true}
              className="ltr w-full px-4 py-2 border border-gray-300 rounded mb-4"
            />
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded transition-colors"
            >
              ورود
            </button>
          </form>
          <p className="mt-4">
            <a href="/auth" className="text-gray-600 hover:underline">
              بازگشت
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Step 2B: Registration form (if the mobile does not exist)
  return (
    <div className="h-dvh w-full flex flex-col justify-center content-center">
      <div
        className="flex flex-col justify-center content-center max-w-md mx-auto p-6 bg-white shadow-md rounded-md text-center"
        dir="rtl"
      >
        <h2 className="text-2xl font-bold mb-4">ایجاد حساب کاربری</h2>
        <form action={action} onSubmit={handleSubmit} noValidate>
          <input type="hidden" name="mobile" value={mobile} />
          <input type="hidden" name="userId" value={userId} />
          <p className="mb-4">شماره تلفن: {mobile}</p>
          <ValidatedInput
            required
            dir="rtl"
            type="text"
            align="right"
            name="fullName"
            value={fullName}
            placeholder="نام و نام خانوادگی (به فارسی)"
            className="ltr w-full px-4 py-2 border border-gray-300 rounded mb-4"
          />
          <ValidatedInput
            dir="auto"
            type="email"
            name="email"
            align="auto"
            value={email}
            placeholder="ایمیل (اختیاری)"
            className="ltr w-full px-4 py-2 border border-gray-300 rounded mb-4"
          />
          <ValidatedInput
            dir="auto"
            name="otp"
            value={otp}
            align="auto"
            type="text"
            placeholder="کد تایید"
            convertFarsiNumbersToEnglish={true}
            className="w-[50%] ltr px-4 py-2 border border-gray-300 rounded mb-4"
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded transition-colors"
          >
            ثبت نام
          </button>
        </form>
        <p className="mt-4">
          <Link href="/auth" className="text-gray-600 hover:underline">
            بازگشت
          </Link>
        </p>
      </div>
    </div>
  );
}
