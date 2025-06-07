"use client";

import Link from "next/link";
import { usdToCredit } from "@/lib/cost";
import { useTheme } from "../ThemeProvider";
import * as Tabs from "@radix-ui/react-tabs";
import { CheckIcon } from "@radix-ui/react-icons";
import type { WebPlansForUsers } from "@/lib/plans";
import { extractDiscountInfo } from "@/lib/discount";
import type { LlmModelPricingDto } from "@/lib/models";

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
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">پلن‌های قیمت‌گذاری</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            پلن مناسب خود را انتخاب کنید و به دنیای بی‌انتهای هوش مصنوعی وارد
            شوید
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const { diffInFarsi, hasDiscount, discountPercent } =
              extractDiscountInfo(plan);

            return (
              <div
                key={index}
                {...(hasDiscount
                  ? {
                      "data-ribbon": discountPercent + "% OFF",
                    }
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
                    <div className="flex-auto"></div>

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

                    <div className="flex-auto"></div>

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

                    {/* Tabs for comparison & features */}
                    <Tabs.Root defaultValue="model-comparison">
                      <Tabs.List className="rtl flex border-b border-border mb-4">
                        <Tabs.Trigger
                          value="model-comparison"
                          className="flex-1 py-2 text-sm text-center border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent"
                        >
                          مقایسه اعتبار
                        </Tabs.Trigger>
                        <Tabs.Trigger
                          value="features"
                          className="flex-1 py-2 text-sm text-center border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent"
                        >
                          ویژگی‌ها
                        </Tabs.Trigger>
                      </Tabs.List>

                      <Tabs.Content
                        value="model-comparison"
                        className="focus:outline-none"
                      >
                        <ul className="space-y-3 text-sm">
                          {modelsForComparison.map((model, idx) => {
                            const inputTokens = Math.floor(
                              (usdToCredit(plan.usdCredits) /
                                model.creditCostPerMilInToken) *
                                1e6,
                            );
                            const outputTokens = Math.floor(
                              (usdToCredit(plan.usdCredits) /
                                model.creditCostPerMilOutToken) *
                                1e6,
                            );

                            return (
                              <li
                                key={idx}
                                className="pb-2 border-b border-border/50"
                              >
                                <div className="font-medium mb-1">
                                  {model.name}
                                </div>
                                <div className="text-foreground/70 flex justify-between rtl">
                                  <span>توکن ورودی:</span>
                                  <span className="font-medium">
                                    {inputTokens.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-foreground/70 flex justify-between rtl">
                                  <span>توکن خروجی:</span>
                                  <span className="font-medium">
                                    {outputTokens.toLocaleString()}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </Tabs.Content>

                      <Tabs.Content
                        value="features"
                        className="focus:outline-none"
                      >
                        <ul className="space-y-2 text-sm rtl">
                          <li className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>دسترسی به تمامی مدل‌های اصلی</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>ذخیره و مدیریت چت‌ها</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flexibility-shrink-0" />
                            <span>ویژگی‌های پیشرفته برای کد و ریاضیات</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>آپلود و تحلیل فایل‌ها</span>
                          </li>
                        </ul>
                      </Tabs.Content>
                    </Tabs.Root>
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
