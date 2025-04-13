"use client";

import Link from "next/link";
import type { Model } from "@/lib/models";
import * as Tabs from "@radix-ui/react-tabs";
import { CheckIcon } from "@radix-ui/react-icons";
import type { webPlansForUsers } from "@/lib/plans";
import { roundWebPlanTokensAmount } from "@/lib/cost";

export default function PricingSection({
  plans,
  modelsForComparison,
}: {
  plans: webPlansForUsers;
  modelsForComparison: Model[];
}) {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            return (
              <div
                key={index}
                className={`bg-card rounded-xl border ${
                  index === 1
                    ? "border-accent relative shadow-lg"
                    : "border-border"
                }`}
              >
                {index === 1 && (
                  <div className="absolute -top-3 right-0 left-0 mx-auto w-fit px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                    پرطرفدار
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-center">
                    {plan.name}
                  </h3>
                  <p className="text-foreground/70 text-sm mb-4 text-center">
                    راهکاری ایده‌آل برای نیازهای شما
                  </p>

                  <div className="mb-6 text-center">
                    <span className="text-3xl font-bold text-center">
                      {plan.displayPrice.toLocaleString()}
                    </span>
                  </div>

                  <Link
                    href={`/auth?selectedPlan=${plan.id}`}
                    className={`w-full flex justify-center items-center py-3 px-4 rounded-lg font-medium ${
                      index === 1
                        ? "bg-accent text-white hover:bg-accent/90"
                        : "bg-muted hover:bg-muted/80"
                    } transition-colors mb-6`}
                  >
                    انتخاب پلن {plan.name}
                  </Link>

                  <div className="border-t border-border pt-6">
                    <div className="mb-4 text-center">
                      <p className="text-lg font-semibold">
                        {plan.credits.toLocaleString()} اعتبار
                      </p>
                    </div>

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
                            const inputTokens = roundWebPlanTokensAmount(
                              (plan.credits / model.creditCostPerMilInToken) *
                                1_000_000,
                            );

                            const outputTokens = roundWebPlanTokensAmount(
                              (plan.credits / model.creditCostPerMilOutToken) *
                                1_000_000,
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
                            <span>امکان ذخیره و مدیریت چت‌ها</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>ویژگی‌های پیشرفته برای کد و ریاضیات</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>آپلود و تحلیل فایل‌ها</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>
                              پشتیبانی فنی {index > 0 ? "اختصاصی" : "استاندارد"}
                            </span>
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
