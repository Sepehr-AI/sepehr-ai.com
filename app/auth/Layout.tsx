/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { toast } from "react-toastify";
import { type FormEvent, useActionState, useEffect, useState } from "react";
import ValidatedInput from "../components/ValidatedInput";
import Link from "next/link";
import {
  checkMobileFormSchema,
  loginFormSchema,
  registerFormSchema,
} from "./validationSchema";
import {
  FiArrowLeft,
  FiSmartphone,
  FiUser,
  FiMail,
  FiLock,
} from "react-icons/fi";

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
  // Keep the existing logic
  const [_1, action, _2] = useActionState<any, FormData>(
    !mobile ? checkMobile : exists === "true" ? login : register,
    {}
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (error) toast.error(error, { position: "top-center", toastId: error });
  }, [error]);

  // Common layout wrapper for all auth forms
  const AuthContainer = ({ children, title, subtitle = null }) => (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-6"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-black p-6 text-white">
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-gray-300 text-sm">{subtitle}</p>
            )}
          </div>
          <div className="p-8">{children}</div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-2"
          >
            <FiArrowLeft />
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );

  // Step 1: Mobile entry form (if no mobile query parameter exists)
  if (!mobile) {
    return (
      <AuthContainer
        title="به سپهر AI خوش آمدید"
        subtitle="برای ورود یا ثبت‌نام، شماره موبایل خود را وارد کنید"
      >
        <form
          action={action}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6"
        >
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <FiSmartphone className="w-5 h-5" />
            </div>
            <ValidatedInput
              required
              dir="ltr"
              type="text"
              name="mobile"
              align="left"
              placeholder="0912xxxxxxx"
              convertFarsiNumbersToEnglish={true}
              className="ltr w-full px-4 py-3 pr-10 text-gray-900 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <span className="animate-pulse">در حال پردازش...</span>
            ) : (
              <span>ادامه</span>
            )}
          </button>
        </form>
      </AuthContainer>
    );
  }

  // Step 2A: Login form (if the mobile exists)
  if (exists === "true") {
    return (
      <AuthContainer
        title="خوش آمدید"
        subtitle="کد تایید ارسال شده به موبایل خود را وارد کنید"
      >
        <form
          action={action}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6"
        >
          <input type="hidden" name="mobile" value={mobile} />
          <input type="hidden" name="userId" value={userId} />

          <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg text-gray-700">
            <FiSmartphone className="text-emerald-500" />
            <span>شماره موبایل:</span>
            <span className="font-medium">{mobile}</span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <FiLock className="w-5 h-5" />
            </div>
            <ValidatedInput
              required
              name="otp"
              dir="ltr"
              value={otp}
              type="text"
              align="center"
              placeholder="کد تایید"
              convertFarsiNumbersToEnglish={true}
              className="ltr text-center w-full px-4 py-3 pr-10 text-gray-900 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-xl tracking-wider"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <span className="animate-pulse">در حال ورود...</span>
            ) : (
              <span>ورود</span>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/auth"
              className="text-gray-500 hover:text-emerald-600 text-sm transition-colors"
            >
              استفاده از شماره دیگر
            </Link>
          </div>
        </form>
      </AuthContainer>
    );
  }

  // Step 2B: Registration form (if the mobile does not exist)
  return (
    <AuthContainer
      title="ایجاد حساب کاربری"
      subtitle="اطلاعات خود را تکمیل کنید"
    >
      <form
        action={action}
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        <input type="hidden" name="mobile" value={mobile} />
        <input type="hidden" name="userId" value={userId} />

        <div className="flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg text-gray-700">
          <FiSmartphone className="text-emerald-500" />
          <span>شماره موبایل:</span>
          <span className="font-medium">{mobile}</span>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
            <FiUser className="w-5 h-5" />
          </div>
          <ValidatedInput
            required
            dir="rtl"
            type="text"
            align="right"
            name="fullName"
            value={fullName}
            placeholder="نام و نام خانوادگی (به فارسی)"
            className="w-full px-4 py-3 pr-10 text-gray-900 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
            <FiMail className="w-5 h-5" />
          </div>
          <ValidatedInput
            dir="auto"
            type="email"
            name="email"
            align="auto"
            value={email}
            placeholder="ایمیل (اختیاری)"
            className="ltr w-full px-4 py-3 pr-10 text-gray-900 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
            <FiLock className="w-5 h-5" />
          </div>
          <ValidatedInput
            dir="auto"
            name="otp"
            value={otp}
            align="auto"
            type="text"
            placeholder="کد تایید"
            convertFarsiNumbersToEnglish={true}
            className="ltr w-full px-4 py-3 pr-10 text-gray-900 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <span className="animate-pulse">در حال ثبت‌نام...</span>
          ) : (
            <span>ثبت‌نام</span>
          )}
        </button>

        <div className="text-center pt-2">
          <Link
            href="/auth"
            className="text-gray-500 hover:text-emerald-600 text-sm transition-colors"
          >
            استفاده از شماره دیگر
          </Link>
        </div>
      </form>
    </AuthContainer>
  );
}
