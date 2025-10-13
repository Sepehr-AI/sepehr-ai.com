import { z } from "zod";

const userIdSchema = z.coerce.number({
  message: "آیدی کاربر باید یک عدد باشد!",
});
export const mobileSchema = z
  .string()
  .trim()
  .min(11, { message: "شماره موبایل باید 11 رقمی باشد!" })
  .max(11, { message: "شماره موبایل باید 11 رقمی باشد!" })
  .regex(/((0?9)|(\+?989))\d{9}/g, { message: "شماره موبایل نامعتبر است!" });
const otpSchema = z.preprocess(
  (v) => String(v).trim(),
  z.coerce
    .number({ message: "کد تایید باید عدد باشد!" })
    .min(100000, { message: "کد تایید 6 رقمی است!" })
    .max(999999, { message: "کد تایید 6 رقمی است!" }),
);

export const checkMobileFormSchema = z.object({
  mobile: mobileSchema,
});

export const loginFormSchema = z.object({
  otp: otpSchema,
  mobile: mobileSchema,
  userId: userIdSchema,
});

export const registerFormSchema = z.object({
  otp: otpSchema,
  mobile: mobileSchema,
  userId: userIdSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "ایمیل نامعتبر است!" })
    .optional(),
  fullName: z
    .string()
    .trim()
    .min(8, { message: "نام و نام‌خانوادگی شما حتی 8 کاراکتر هم نیست!" })
    .max(30, { message: "نام و نام‌خانوادگی شما بیشتر از 30 کاراکتر است!" })
    .regex(
      /^(?:[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+(?:\u200c[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+)*)(?: (?:[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+(?:\u200c[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+)*))*$/u,
      {
        message:
          "نام و نام خانوادگی نامعتبر است. این فیلد فقط باید دارای کاراکتر های الفبای فارسی باشد و فقط یک کاراکتر فاصله بین هر کلمه مجاز است.",
      },
    ),
});
