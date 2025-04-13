/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { toast } from "react-toastify";
import { type FormEvent, useActionState, useEffect, useState } from "react";
import ValidatedInput from "@/components/ValidatedInput";
import Link from "next/link";
import {
  checkMobileFormSchema,
  loginFormSchema,
  registerFormSchema,
} from "./validationSchema";
import { motion } from "framer-motion";
import Icon from "@/components/landing/Icon";
import { useTheme } from "@/components/ThemeProvider";
import * as Form from "@radix-ui/react-form";
import * as Separator from "@radix-ui/react-separator";
import {
  MobileIcon,
  PersonIcon,
  EnvelopeClosedIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";

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
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_1, action, _2] = useActionState<any, FormData>(
    !mobile ? checkMobile : exists === "true" ? login : register,
    {},
  );

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
      setIsLoading(false);
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

  // Common page elements
  const AuthPageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      className="min-h-screen w-full bg-background flex justify-center items-center p-4 md:p-8"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8 flex justify-center">
          <Icon
            fill={theme === "dark" ? "#fff" : "#000"}
            className="h-12 w-auto"
          />
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {children}
        </div>

        <div className="mt-4 text-center text-sm text-foreground/60">
          <p>سپهر AI - دنیای هوش مصنوعی در دستان شما</p>
        </div>
      </motion.div>
    </div>
  );

  // Common form button
  const SubmitButton = ({ text }: { text: string }) => (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 px-4 rounded-lg font-medium transition-colors relative overflow-hidden group"
    >
      <span className={isLoading ? "opacity-0" : "opacity-100"}>{text}</span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin"></div>
        </div>
      )}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transform translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200">
        <ArrowLeftIcon />
      </div>
    </button>
  );

  // Step 1: Mobile entry form (if no mobile query parameter exists)
  if (!mobile) {
    return (
      <AuthPageWrapper>
        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">ورود / ثبت‌نام</h2>
            <p className="text-foreground/60 text-sm">
              برای شروع، لطفاً شماره تلفن همراه خود را وارد کنید
            </p>
          </div>

          <Form.Root
            action={action}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
          >
            <Form.Field name="mobile">
              <div className="relative">
                <MobileIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <ValidatedInput
                  required
                  dir="ltr"
                  type="text"
                  name="mobile"
                  align="left"
                  placeholder="0912xxxxxxx"
                  convertFarsiNumbersToEnglish={true}
                  className="w-full px-4 py-3 pr-10 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
                />
              </div>
              <Form.Message
                className="text-xs text-destructive mt-1"
                match="valueMissing"
              >
                شماره تلفن الزامی است
              </Form.Message>
            </Form.Field>

            <SubmitButton text="ادامه" />
          </Form.Root>

          <div className="mt-8">
            <Separator.Root className="bg-border h-px w-full my-4" />
            <div className="w-full text-center text-sm text-foreground/60">
              <span>با ورود یا ثبت‌نام، </span>
              <span>
                <Link href="/terms" className="text-accent hover:underline">
                  قوانین و مقررات
                </Link>
              </span>
              <span> سایت را می‌پذیرید.</span>
            </div>
          </div>
        </div>
      </AuthPageWrapper>
    );
  }

  // Step 2A: Login form (if the mobile exists)
  if (exists === "true") {
    return (
      <AuthPageWrapper>
        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PersonIcon className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-1">خوش آمدید!</h2>
            <p className="text-foreground/60 text-sm">
              کد تایید به شماره {mobile} ارسال شد
            </p>
          </div>

          <Form.Root
            action={action}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
          >
            <input type="hidden" name="mobile" value={mobile} />
            <input type="hidden" name="userId" value={userId} />

            <Form.Field name="otp">
              <div className="relative">
                <LockClosedIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <ValidatedInput
                  required
                  name="otp"
                  dir="ltr"
                  value={otp}
                  type="text"
                  align="center"
                  placeholder="کد تایید را وارد کنید"
                  convertFarsiNumbersToEnglish={true}
                  className="w-full px-4 py-3 pr-10 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors text-center"
                />
              </div>
              <Form.Message
                className="text-xs text-destructive mt-1"
                match="valueMissing"
              >
                کد تایید الزامی است
              </Form.Message>
            </Form.Field>

            <SubmitButton text="ورود به حساب کاربری" />
          </Form.Root>

          <div className="mt-6 text-center">
            <Link
              href="/auth"
              className="inline-flex items-center text-sm text-foreground/60 hover:text-accent transition-colors"
            >
              <ChevronRightIcon className="ml-1" />
              بازگشت به صفحه ورود
            </Link>
          </div>
        </div>
      </AuthPageWrapper>
    );
  }

  // Step 2B: Registration form (if the mobile does not exist)
  return (
    <AuthPageWrapper>
      <div className="p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PersonIcon className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-1">ایجاد حساب کاربری</h2>
          <p className="text-foreground/60 text-sm">
            کد تایید به شماره {mobile} ارسال شد
          </p>
        </div>

        <Form.Root
          action={action}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          <input type="hidden" name="mobile" value={mobile} />
          <input type="hidden" name="userId" value={userId} />

          <Form.Field name="fullName">
            <div className="relative">
              <PersonIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <ValidatedInput
                required
                dir="rtl"
                type="text"
                align="right"
                name="fullName"
                value={fullName}
                placeholder="نام و نام خانوادگی (به فارسی)"
                className="w-full px-4 py-3 pr-10 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
              />
            </div>
            <Form.Message
              className="text-xs text-destructive mt-1"
              match="valueMissing"
            >
              نام و نام خانوادگی الزامی است
            </Form.Message>
          </Form.Field>

          <Form.Field name="email">
            <div className="relative">
              <EnvelopeClosedIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <ValidatedInput
                dir="auto"
                type="email"
                name="email"
                align="auto"
                value={email}
                placeholder="ایمیل (اختیاری)"
                className="w-full px-4 py-3 pr-10 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
              />
            </div>
          </Form.Field>

          <Form.Field name="otp">
            <div className="relative">
              <LockClosedIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <ValidatedInput
                dir="auto"
                name="otp"
                value={otp}
                align="auto"
                type="text"
                placeholder="کد تایید"
                convertFarsiNumbersToEnglish={true}
                className="w-full px-4 py-3 pr-10 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
              />
            </div>
            <Form.Message
              className="text-xs text-destructive mt-1"
              match="valueMissing"
            >
              کد تایید الزامی است
            </Form.Message>
          </Form.Field>

          <SubmitButton text="تکمیل ثبت نام" />
        </Form.Root>

        <div className="mt-6 text-center">
          <Link
            href="/auth"
            className="inline-flex items-center text-sm text-foreground/60 hover:text-accent transition-colors"
          >
            <ChevronRightIcon className="ml-1" />
            بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </AuthPageWrapper>
  );
}
