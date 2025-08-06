"use client";

import Link from "next/link";
import {
  numberToReadableFarsi,
  roundToDecimals,
  roundToUnit,
  usdToCredit,
} from "@/lib/cost";
import { useTheme } from "../ThemeProvider";
import { CheckIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import type { WebPlansForUsers } from "@/lib/plans";
import { extractDiscountInfo } from "@/lib/discount";
import type { LlmModelPricingDto } from "@/lib/models";
import PricingSectionDoodleArrow from "./PricingSectionDoodleArrow";

export default function PricingSection({
  plans,
  modelsForComparison,
}: {
  plans: WebPlansForUsers;
  modelsForComparison: LlmModelPricingDto[];
}) {
  const { theme } = useTheme();

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-2">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">پلن‌های قیمت‌گذاری</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            پلن مناسب خود را انتخاب کنید و به دنیای بی‌انتهای هوش مصنوعی وارد
            شوید
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-8xl mx-auto">
          {plans.map((plan, index) => {
            const { diffInFarsi, hasDiscount, discountPercent } =
              extractDiscountInfo(plan);

            return (
              <div
                key={index}
                {...(hasDiscount
                  ? { "data-ribbon": discountPercent + "% OFF" }
                  : {})}
                className={
                  `bg-card rounded-xl border shadow-gray-800 ${
                    index === 1 ? "border-accent relative" : "border-border"
                  }` +
                  (hasDiscount ? " ribbon-container" : "") +
                  (theme === "light" ? " shadow-lg" : " shadow-sm ")
                }
              >
                {index === 1 && (
                  <div className="absolute top-1 right-0 left-0 mx-auto w-fit px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                    پرطرفدار
                  </div>
                )}

                <div className="p-12 flex flex-col h-full">
                  <h3 className="text-xl font-bold mb-2 text-center">
                    {plan.name}
                  </h3>
                  <p className="text-foreground/70 text-sm mb-6 text-center">
                    راهکاری ایده‌آل برای نیازهای شما
                  </p>

                  <div className="h-full flex flex-col my-1">
                    <div className="flex-auto" />

                    {/* Price & Discount UI */}
                    <div className="flex-none mb-6 text-center relative flex flex-col items-center">
                      {hasDiscount && diffInFarsi && (
                        <span className="inline-block mb-2 px-3 py-1 bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900 rounded-full text-xs font-semibold">
                          تخفیف تا {diffInFarsi} دیگر معتبر است
                        </span>
                      )}

                      <div className="flex flex-col items-center gap-2">
                        {hasDiscount && (
                          <span className="text-sm line-through text-foreground/50">
                            {plan.displayPrice.toLocaleString()} تومان
                          </span>
                        )}
                        <span className="my-3 text-2xl font-bold">
                          {hasDiscount
                            ? plan.discountedDisplayPrice
                            : plan.displayPrice}{" "}
                          تومان
                        </span>
                      </div>
                    </div>

                    <div className="flex-auto" />

                    <Link
                      href={`/auth?selectedPlan=${plan.id}`}
                      className={`w-full flex flex-none justify-center items-center py-3 px-4 rounded-lg font-medium mt-auto ${
                        index === 1
                          ? "bg-accent text-white hover:bg-accent/90"
                          : "hover:bg-muted/50 border-2 border-accent"
                      } transition-colors mb-6`}
                    >
                      انتخاب پلن {plan.name}
                    </Link>
                  </div>

                  <div className="border-t border-border pt-6 mt-auto">
                    {/* Credits info */}
                    <div className="mb-4 text-center">
                      <p className="text-lg font-semibold">
                        {usdToCredit(plan.usdCredits).toLocaleString()} اعتبار
                      </p>
                    </div>

                    {/* Model Value Table */}
                    <div className="flex justify-center">
                      <div className="w-[98%] border-t border-border py-6 mt-auto">
                        <h5 className="text-center font-bold mb-2">
                          این اعتبار چقدر ارزش داره؟
                        </h5>
                        <div className="my-1 w-full flex justify-center text-center">
                          <PricingSectionDoodleArrow
                            className="w-15 h-15"
                            fill={theme === "light" ? "#000" : "#fff"}
                          />
                        </div>
                        <table className="w-full text-sm divide-y divide-border/50 rtl">
                          <thead>
                            <tr>
                              <th className="rtl text-right py-2 font-medium">
                                اجازه استفاده تقریبی
                              </th>
                              <th className="rtl text-left py-2 font-medium">
                                مثلا اگر مدل این باشه
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {modelsForComparison.map((model, idx) => {
                              const { raw, rawOut, unit, inOutRatio } = (() => {
                                const raw =
                                  (usdToCredit(plan.usdCredits) /
                                    model.creditCostPerMilInToken +
                                    usdToCredit(plan.usdCredits) /
                                      model.creditCostPerMilOutToken) *
                                  (1e6 / 1.5);
                                const rawOut =
                                  (usdToCredit(plan.usdCredits) /
                                    model.creditCostPerMilOutToken) *
                                  (1e6 / 1.5);
                                const unit =
                                  raw > 10_000_000
                                    ? 1_000_000
                                    : raw > 1_000_000
                                      ? 100_000
                                      : 10_000;
                                return {
                                  raw,
                                  unit,
                                  rawOut,
                                  inOutRatio: roundToDecimals(
                                    model.creditCostPerMilOutToken /
                                      model.creditCostPerMilInToken,
                                    1,
                                  ),
                                };
                              })();
                              const totalFarsiWords = roundToUnit(raw, unit);

                              return (
                                <tr
                                  key={idx}
                                  className="border-b border-border/50"
                                >
                                  <td className="rtl text-right py-3">
                                    <div>
                                      {numberToReadableFarsi(
                                        roundToUnit(rawOut, unit) / 2_000,
                                      )}{" "}
                                      مقاله 2 هزار کلمه‌ای
                                    </div>
                                    <div className="flex gap-1 items-center">
                                      (
                                      <span
                                        className="font-vazir-force"
                                        title={
                                          "در این مدل ضریب مصرف اعتبار کلمه خروجی (متنی که از مدل دریافت میکنید) " +
                                          inOutRatio +
                                          " برابر کلمه ورودی (متنی که شما میفرستید) می‌باشد."
                                        }
                                      >
                                        <QuestionMarkCircledIcon />
                                      </span>
                                      <span className="text-xs">
                                        {numberToReadableFarsi(totalFarsiWords)}{" "}
                                        کلمه
                                      </span>
                                      )
                                    </div>
                                  </td>
                                  <td className="ltr text-left py-3 font-medium">
                                    {model.name.split(":")[1].trim()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <p className="mt-4 text-sm text-center">
                          برای مشاهده اجازه استفاده از باقی مدل‌ها با این اعتبار{" "}
                          <Link
                            href={`/usage?plan=${plan.id}`}
                            className="text-accent underline"
                          >
                            کلیک کنید
                          </Link>
                          .
                        </p>
                      </div>
                    </div>

                    {/* Features Section */}
                    <div className="w-full flex justify-center border-t border-border pt-4 mt-auto">
                      <ul className="space-y-2 text-sm rtl">
                        <li className="flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>دسترسی به تمامی مدل‌ها</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>ذخیره و مدیریت چت‌ها</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>آپلود و تحلیل فایل‌ها</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
