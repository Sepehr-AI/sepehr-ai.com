"use client";

import {
  numberToReadableFarsi,
  roundToDecimals,
  roundToUnit,
  usdToCredit,
} from "@/lib/cost";
import { extractDiscountInfo } from "@/lib/discount";
import type { ImageModelPricingDto } from "@/lib/imageModels";
import type { LanguageModelPricingDto } from "@/lib/languageModels";
import type { WebPlansForUsers } from "@/lib/plans";
import type { VideoModelPricingDto } from "@/lib/videoModels";
import {
  CheckIcon,
  ImageIcon,
  QuestionMarkCircledIcon,
  VideoIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";

import { useTheme } from "../ThemeProvider";
import PricingSectionDoodleArrow from "./PricingSectionDoodleArrow";

export default function PricingSection({
  plans,
  modelsForComparison,
  imageModelsForComparison,
  videoModelsForComparison,
}: {
  plans: WebPlansForUsers;
  modelsForComparison: LanguageModelPricingDto[];
  imageModelsForComparison: ImageModelPricingDto[];
  videoModelsForComparison: VideoModelPricingDto[];
}) {
  const { theme } = useTheme();

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto px-[3dvw] xl:max-w-8xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">پلن‌های قیمت‌گذاری</h2>
          <p className="text-foreground/70">
            فقط اعتبار می‌خرید؛ هر زمان بخواهید بین مدل‌های زبان، تصویر و ویدیو
            جابه‌جا شوید
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:gap-4 md:grid-cols-2 xl:gap-6 xl:grid-cols-3">
          {plans.map((plan, index) => {
            const { diffInFarsi, hasDiscount, discountPercent } =
              extractDiscountInfo(plan);
            const credits = usdToCredit(plan.usdCredits);

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
                  (theme === "light" ? " shadow-lg" : " shadow-sm ") +
                  // Center the 3rd grid element when 2 are shown in each row, also fully takes up the width
                  (index === plans.length - 1
                    ? "[grid-column:auto] md:[grid-column:1/-1] xl:[grid-column:auto]"
                    : "")
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
                        <span className="text-lg text-foreground/90 py-2 px-4 border-accent border-2 rounded-4xl">
                          {credits.toLocaleString()} اعتبار
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
                    {/* What you can do with this credit */}
                    <div className="mb-4 text-center">
                      <h5 className="text-lg font-semibold">
                        با این اعتبار چه کارهایی می‌شود کرد؟
                      </h5>

                      <div className="my-1 w-full flex justify-center text-center">
                        <PricingSectionDoodleArrow className="w-15 h-15" />
                      </div>
                    </div>

                    {/* Language table */}
                    <AllowanceLanguage
                      credits={credits}
                      models={modelsForComparison}
                    />

                    {/* Image table */}
                    <AllowanceImage
                      credits={credits}
                      models={imageModelsForComparison}
                    />

                    {/* Video table */}
                    <AllowanceVideo
                      credits={credits}
                      models={videoModelsForComparison}
                    />

                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-[0.79em] text-justify">
                        <span className="text-orange-700">تذکر:</span>
                        <span>
                          {" "}
                          این اعداد نشان‌دهندهٔ سقف استفاده هر مدل به‌صورت مستقل
                          هستند. در صورت استفاده از چند مدل مختلف، این مقادیر با
                          هم جمع نمی‌شوند؛ بلکه میزان استفاده بر اساس اعتبار کلی
                          پلن و میزان مصرف هر مدل از همان اعتبار محاسبه می‌شود.
                        </span>
                      </p>
                    </div>

                    {/* Features Section */}
                    <div className="w-full flex justify-center border-t border-border pt-4 mt-4">
                      <ul className="space-y-2 text-sm rtl">
                        <li className="flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>دسترسی به همه مدل‌های زبان، تصویر و ویدیو</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckIcon className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>
                            ذخیره و مدیریت چت‌ها و پروژه‌ها فقط در مرورگر شما
                          </span>
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

function AllowanceLanguage({
  credits,
  models,
}: {
  credits: number;
  models: LanguageModelPricingDto[];
}) {
  return (
    <div className="flex justify-center">
      <div className="w-[98%] border-t border-border py-6 mt-auto">
        <h5 className="text-center font-bold mb-2">متن (زبان)</h5>
        <table className="w-full text-sm divide-y divide-border/50 rtl">
          <thead>
            <tr>
              <th className="rtl text-right py-2 font-medium">
                اجازه استفاده تقریبی
              </th>
              <th className="rtl text-left py-2 font-medium">
                مثلاً اگر مدل این باشد
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, idx) => {
              const calc = (() => {
                const raw =
                  (credits / model.milInCreditCost +
                    credits / model.milOutCreditCost) *
                  (1e6 / 1.5);
                const rawOut = (credits / model.milOutCreditCost) * (1e6 / 1.5);
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
                    model.milOutCreditCost / model.milInCreditCost,
                    1,
                  ),
                };
              })();
              const totalFarsiWords = roundToUnit(calc.raw, calc.unit);

              return (
                <tr key={idx}>
                  <td className="rtl text-right py-3">
                    <div>
                      {numberToReadableFarsi(
                        roundToUnit(calc.rawOut, calc.unit) / 2_000,
                      )}{" "}
                      مقاله ۲هزار کلمه‌ای
                    </div>
                    <div className="flex gap-1 items-center">
                      (<QuestionMarkCircledIcon className="w-4 h-4" />
                      <span className="text-xs">
                        {numberToReadableFarsi(totalFarsiWords)} کلمه
                      </span>
                      )
                    </div>
                  </td>
                  <td className="ltr text-left py-3 font-medium">
                    {model.name}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllowanceImage({
  credits,
  models,
}: {
  credits: number;
  models: ImageModelPricingDto[];
}) {
  return (
    <div className="flex justify-center">
      <div className="w-[98%] border-t border-border py-6">
        <h5 className="text-center font-bold mb-2 flex items-center gap-2 justify-center">
          <ImageIcon /> تصویر
        </h5>
        <table className="w-full text-sm divide-y divide-border/50 rtl">
          <thead>
            <tr>
              <th className="rtl text-right py-2 font-medium">
                تقریباً چند تصویر
              </th>
              <th className="rtl text-left py-2 font-medium">
                اگر مدل این باشد
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => {
              const count = Math.floor(credits / m.creditCostPerImage);
              return (
                <tr key={i}>
                  <td className="rtl text-right py-3">
                    {count ? (
                      numberToReadableFarsi(count)
                    ) : (
                      <span className="text-orange-700">صفر</span>
                    )}{" "}
                    تصویر
                  </td>
                  <td className="ltr text-left py-3 font-medium">{m.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllowanceVideo({
  credits,
  models,
}: {
  credits: number;
  models: VideoModelPricingDto[];
}) {
  return (
    <div className="flex justify-center">
      <div className="w-[98%] border-t border-border py-6">
        <h5 className="text-center font-bold mb-2 flex items-center gap-2 justify-center">
          <VideoIcon /> ویدیو
        </h5>
        <table className="w-full text-sm divide-y divide-border/50 rtl">
          <thead>
            <tr>
              <th className="rtl text-right py-2 font-medium">
                تقریباً چند ویدیو
              </th>
              <th className="rtl text-left py-2 font-medium">
                اگر مدل این باشد
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => {
              const count = Math.max(
                0,
                Math.floor(credits / m.creditCostPerVideo),
              );
              const duration = m.durations.sort()[0];
              return (
                <tr key={i}>
                  <td className="rtl text-right py-3">
                    {count ? (
                      numberToReadableFarsi(count)
                    ) : (
                      <span className="text-orange-700">صفر</span>
                    )}{" "}
                    ویدیو
                    {duration ? (
                      <span className="text-foreground/60 text-xs">
                        {" "}
                        — {duration}s
                      </span>
                    ) : null}
                  </td>
                  <td className="ltr text-left py-3 font-medium">{m.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
