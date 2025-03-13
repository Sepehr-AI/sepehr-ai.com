"use client";

import { useEffect } from "react";
import { toast } from "react-toastify";

export default function AuthLayout({
  email,
  error,
  exists,
  login,
  register,
  checkEmail,
}: {
  email?: string;
  error?: string;
  exists?: string;
  selectedPlan?: number;
  login: (formData: FormData) => Promise<never>;
  register: (formData: FormData) => Promise<never>;
  checkEmail: (formData: FormData) => Promise<never>;
}) {
  useEffect(() => {
    if (error) toast.error(error, { position: "top-center", toastId: error });
  }, [error]);

  // Step 1: Email entry form (if no email query parameter exists)
  if (!email) {
    return (
      <div
        className="w-full h-dvh flex justify-center flex-col content-center max-w-md mx-auto p-6 bg-white text-center"
        dir="rtl"
      >
        <div className="shadow-2xl shadow-gray-800 p-8 rounded-md">
          <h2 className="text-2xl font-bold mb-6">ایمیل خود را وارد کنید</h2>
          <form action={checkEmail}>
            <input
              type="email"
              name="email"
              placeholder="example@abc.com"
              required
              className="ltr w-full px-4 py-2 border border-gray-300 rounded mb-4"
            />
            <button
              type="submit"
              className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
            >
              ادامه
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 2A: Login form (if the email exists)
  if (exists === "true") {
    return (
      <div
        className="w-full h-full flex flex-col justify-center content-center max-w-md mx-auto p-6 bg-white rounded-md text-center"
        dir="rtl"
      >
        <div className="shadow-2xl shadow-gray-800 p-8 rounded-md">
          <h2 className="text-2xl font-bold mb-4">خوش اومدی!</h2>
          <p className="mb-4">لطفا رمز عبور خود را وارد کنید.</p>
          <form action={login}>
            <input type="hidden" name="email" value={email} />
            <p className="mb-4">ایمیل: {email}</p>
            <input
              type="password"
              name="password"
              placeholder="********"
              required
              className="ltr w-full px-4 py-2 border border-gray-300 rounded mb-4"
            />
            <button
              type="submit"
              className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
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

  // Step 2B: Registration form (if the email does not exist)
  return (
    <div
      className="flex flex-col justify-center content-center h-full w-full max-w-md mx-auto p-6 bg-white shadow-md rounded-md text-center"
      dir="rtl"
    >
      <h2 className="text-2xl font-bold mb-4">ایجاد حساب کاربری</h2>
      <p className="mb-4">لطفا رمز عبور خود را دو بار وارد کنید.</p>
      <form action={register}>
        <input type="hidden" name="email" value={email} />
        <p className="mb-4">ایمیل: {email}</p>
        <input
          type="text"
          name="userName"
          placeholder="نام کامل"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
        />
        <input
          type="text"
          name="phoneNumber"
          placeholder="شماره تلفن"
          required
          className="ltr w-full px-4 py-2 border border-gray-300 rounded mb-4"
        />
        <input
          type="password"
          name="password"
          placeholder="رمز عبور"
          required
          className="ltr placeholder:text-right w-full px-4 py-2 border border-gray-300 rounded mb-4"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="تکرار رمز عبور"
          required
          className="ltr placeholder:text-right w-full px-4 py-2 border border-gray-300 rounded mb-4"
        />
        <button
          type="submit"
          className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
        >
          ثبت نام
        </button>
      </form>
      <p className="mt-4">
        <a href="/auth" className="text-gray-600 hover:underline">
          بازگشت
        </a>
      </p>
    </div>
  );
}
