/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import type { z } from "zod";
import Loading from "@/components/Loading";
import { useEffect, useState } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { sepehrAiPaymentResultPayloadSchema } from "@/sepehr-ai-ipg/src/lib";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const TELEGRAM_SUPPORT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_USERNAME || "example";

export default function PaymentResultPage() {
  const params = useSearchParams();
  const [payload, setPayload] = useState<z.infer<
    typeof sepehrAiPaymentResultPayloadSchema
  > | null>(null);

  useEffect(() => {
    const doIt = async () => {
      const parseRes = await sepehrAiPaymentResultPayloadSchema.safeParseAsync(
        Object.fromEntries(params),
      );
      if (!parseRes.success) {
        console.error("Invalid payment result payload:", parseRes.error.errors);
        redirect("/dashboard/payment");
      }

      setPayload(parseRes.data);
    };

    doIt();
  }, [params]);

  if (!payload) return <Loading />;

  let Icon;
  let title;
  let iconColor;
  let description;
  const message = (payload as any).message || (payload as any).Message;
  switch (payload.respcode) {
    case 1:
      Icon = FaExclamationCircle;
      iconColor = "text-yellow-500";
      title = "پرداخت موفق (نیاز به پیگیری)";
      description = "پرداخت موفقیت‌آمیز بود اما اطلاعات در سیستم ذخیره نشد.";
      break;
    case 0:
      Icon = FaCheckCircle;
      title = "پرداخت موفق";
      iconColor = "text-green-500";
      description =
        "پرداخت شما با موفقیت انجام شد. اعتبار شما تا حداکثر ۲۴ ساعت پردازش و به حساب کاربری شما واریز خواهد شد.";
      break;
    case -1:
    case -2:
      Icon = FaTimesCircle;
      title = "پرداخت ناموفق";
      iconColor = "text-red-500";
      description =
        "پرداخت انجام نشد. لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.";
      break;
    default:
      throw new Error("Unreachable!");
  }

  return (
    <div className="flex flex-col my-auto px-2">
      <div className="justify-center content-center max-w-xl mx-auto flex-auto shrink overflow-y-auto my-auto bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="text-center space-y-6">
          {Icon && <Icon className={`h-20 w-20 mx-auto ${iconColor}`} />}

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-foreground/70">{description}</p>
          </div>

          {payload.respcode === 1 && (
            <div className="bg-background/50 border border-border rounded-lg p-4">
              <p className="text-sm mt-2 text-red-500 dark:text-red-300">
                لطفاً از اطلاعات زیر عکس بگیرید و به پشتیبانی ارسال کنید. عدم
                ارسال اطلاعات زیر به پشتیبانی سبب از دست رفتن اشتراک می‌شود.
              </p>
            </div>
          )}

          <div className="text-[0.925rem] pt-4 border-t border-border w-[70%] mx-auto space-y-1">
            <p className="text-foreground/80">
              <span>پیغام سیستم: </span>
              <span>{message}</span>
            </p>
            <p className="text-foreground/80">
              <span>کد رهگیری: </span>
              <span>{payload.tracenumber || "بدون کد رهگیری"}</span>
            </p>
            {payload.respcode === 1 &&
              Object.entries(payload).map(([key, value], idx) => (
                <p key={idx} className="text-foreground/80">
                  <span>{key}: </span>
                  <span>{value || "null"}</span>
                </p>
              ))}
          </div>

          <div className="pt-4 border-t border-border space-x-reverse space-x-2">
            <span className="ltr text-right">پشتیبانی تلگرام:</span>
            <button className="ltr text-left bg-accent hover:bg-accent/90 text-white py-2 px-4 rounded-lg transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
              <a
                target="_blank"
                href={`https://t.me/${TELEGRAM_SUPPORT_USERNAME}`}
              >
                @{TELEGRAM_SUPPORT_USERNAME}
              </a>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
