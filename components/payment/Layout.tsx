"use client";

import Loading from "@/components/Loading";
import { numberToReadableFarsi, roundWebPlan, usdToCredit } from "@/lib/cost";
import { computeCouponDiscountRial, extractDiscountInfo } from "@/lib/discount";
import type { WebPlansForUsers } from "@/lib/plans";
import { NEXT_PUBLIC_BASE_URL } from "@/lib/url";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CiDollar } from "react-icons/ci";
import { toast } from "react-toastify";

import { chargeAccountAction } from "../../app/dashboard/payment/actions";

function Form({
  plans,
  webBalance,
  defaultSelectedPlanId,
}: {
  webBalance: number;
  plans: WebPlansForUsers;
  defaultSelectedPlanId?: number;
}) {
  const { pending } = useFormStatus();
  const [couponCode, setCouponCode] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<number>(
    // id - 1 = index
    (defaultSelectedPlanId || 1) - 1,
  );
  const [applying, setApplying] = useState<boolean>(false);

  // store applied coupon meta so we can recompute locally for any plan
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    amount: string; // e.g., "10%" or "50000"
  } | null>(null);

  // helper to compute the base (pre-coupon) price in Rial for the selected plan
  const basePriceRial = useMemo(() => {
    const plan = plans[selectedPlanId];
    const { hasDiscount, discountPercent } = extractDiscountInfo(plan);
    const price = plan.price; // already rounded on the server

    if (hasDiscount && discountPercent > 0) {
      return roundWebPlan(price - (price * discountPercent) / 100);
    }
    return price;
  }, [plans, selectedPlanId]);

  // compute the final price when coupon is applied; no API calls on plan change
  const finalPriceRialWithCoupon = useMemo(() => {
    if (!appliedCoupon) return null;
    const discountRial = computeCouponDiscountRial(
      appliedCoupon.amount,
      basePriceRial,
    );
    // match server’s rounding: floor to nearest 10,000 rial after discount
    const finalRial =
      Math.floor(Math.max(0, basePriceRial - discountRial) / 1e4) * 1e4;
    return finalRial;
  }, [appliedCoupon, basePriceRial]);

  if (pending) return <Loading />;

  const { hasDiscount, discountPercent, diffInFarsi } = extractDiscountInfo(
    plans[selectedPlanId],
  );

  return (
    <div className="flex justify-center w-full h-full">
      <div
        className="justify-center content-center max-w-xl mx-2 flex-auto shrink overflow-y-auto my-auto bg-card border border-border rounded-xl p-6 shadow-sm"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Credit Balance Section */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold mb-3">میزان اعتبار شما</h2>
          <div className="flex items-center justify-center gap-1 text-3xl font-bold text-accent">
            <span>{webBalance}</span>
            <CiDollar className="h-6 w-6" />
          </div>
        </div>

        {/* Plans Section */}
        <div className="space-y-5">
          <h2 className="text-lg font-medium">انتخاب طرح شارژ</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`flex flex-col p-4 rounded-lg cursor-pointer transition-all ${
                  selectedPlanId === index
                    ? "bg-accent/10 border-2 border-accent"
                    : "bg-background border border-border hover:border-accent/50"
                } ${index === plans.length - 1 ? "col-span-2 md:col-span-1" : ""}`}
                onClick={() => setSelectedPlanId(index)} // CHANGED: no API call; recompute locally via useMemo
              >
                <p className="text-center mb-2 font-medium">{plan.name}</p>
                <p className="text-xl text-center font-semibold mt-auto">
                  <span>
                    {usdToCredit(plan.usdCredits).toLocaleString() + " "}
                  </span>
                  <span>اعتبار</span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-background/50 border border-border rounded-lg">
            <div className="space-y-1.5 text-sm flex flex-col">
              {hasDiscount && (
                <div className="space-y-1.5 text-sm flex flex-col md:flex-row items-center mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="px-3 py-2 bg-linear-to-r from-yellow-300 to-yellow-400 text-yellow-900 rounded-full font-semibold">
                      <span className="px-2 py-1 ml-2 bg-green-800 text-white rounded-full">
                        %{discountPercent}
                      </span>
                      <span>تخفیف تا {diffInFarsi}:</span>
                    </span>
                  </div>
                  <div className="flex flex-auto gap-2 items-center">
                    <div className="flex-auto"></div>
                    <span className="content-center flex-none font-medium line-through text-foreground/60">
                      <span>{plans[selectedPlanId].displayPrice} </span>
                      <span className="text-foreground/70 mr-1">تومان</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Coupon field + apply */}
              <div className="flex flex-col gap-2 mb-3">
                <label
                  className="text-sm text-foreground/90"
                  htmlFor="couponCode"
                >
                  کد تخفیف (اختیاری)
                </label>
                <div className="flex gap-2">
                  <input
                    id="couponCode"
                    name="couponCode"
                    className="text-center flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/60"
                    placeholder="کد تخفیف"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setAppliedCoupon(null); // clear applied coupon
                    }}
                    autoComplete="off"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setApplying(true);
                        const plan = plans[selectedPlanId];
                        const res = await fetch(
                          `${NEXT_PUBLIC_BASE_URL}/api/validate-coupon`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              planId: plan.id,
                              couponCode,
                            }),
                          },
                        );
                        const data = await res.json();
                        if (!data?.ok) {
                          throw new Error(
                            data?.error || "کد تخفیف نامعتبر است.",
                          );
                        }

                        // remember coupon amount to re-apply locally
                        if (data.couponAmount) {
                          setAppliedCoupon({
                            code: data.normalizedCode || couponCode,
                            amount: data.couponAmount,
                          });
                        }

                        toast.success("کد تخفیف با موفقیت اعمال شد!", {
                          position: "top-center",
                          toastId: "couponApplied",
                        });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      } catch (e: any) {
                        toast.error(e?.message || "امکان اعمال کد نبود.", {
                          position: "top-center",
                          toastId: "couponApplyErr",
                        });
                        setAppliedCoupon(null);
                      } finally {
                        setApplying(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-60"
                    disabled={applying || !couponCode.trim()}
                  >
                    {applying ? "در حال بررسی..." : "اعمال کد"}
                  </button>
                </div>

                {/* small pill to show active coupon and a clear button */}
                {appliedCoupon && (
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="px-2 py-1 rounded-full bg-background/90 text-green-700">
                      کد اعمال شد: {appliedCoupon.code}
                    </span>
                    <button
                      type="button"
                      className="text-accent/90 hover:text-foreground"
                      onClick={() => setAppliedCoupon(null)}
                    >
                      لغو کد
                    </button>
                  </div>
                )}
              </div>

              {/* Amount row */}
              <div className="flex">
                <div className="flex items-center justify-between gap-4">
                  <span className="hidden md:block">مبلغ قابل پرداخت:</span>
                </div>
                <div className="flex flex-auto gap-2 items-baseline">
                  <div className="md:flex-auto"></div>
                  <button
                    type="submit"
                    className="flex-1/3 md:hidden w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg transition-colors"
                  >
                    پرداخت
                  </button>
                  <div className="flex-auto"></div>

                  {/* If coupon applied, show old price (red, struck) and new price (green) */}
                  {appliedCoupon && finalPriceRialWithCoupon !== null ? (
                    <div className="flex items-baseline gap-3">
                      <span className="content-center flex-none font-medium line-through text-red-500/80">
                        {numberToReadableFarsi(basePriceRial / 10)}
                        <span className="text-foreground/70 mr-1"> تومان</span>
                      </span>
                      <span className="content-center flex-none font-semibold text-green-600">
                        {numberToReadableFarsi(finalPriceRialWithCoupon / 10)}
                        <span className="text-foreground/70 mr-1"> تومان</span>
                      </span>
                    </div>
                  ) : (
                    // Original behavior (seasonal discount display)
                    <span className="content-center flex-none font-medium">
                      <span>
                        {plans[selectedPlanId].discountedDisplayPrice
                          ? plans[selectedPlanId].discountedDisplayPrice
                          : plans[selectedPlanId].displayPrice}{" "}
                      </span>
                      <span className="text-foreground/70 mr-1">تومان</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <input type="hidden" name="planId" value={plans[selectedPlanId].id} />

          <button
            type="submit"
            className="hidden md:block w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg transition-colors"
          >
            پرداخت
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentLayout({
  plans,
  webBalance,
  balanceInsufficient,
  defaultSelectedPlanId,
  couponError,
}: {
  webBalance: number;
  plans: WebPlansForUsers;
  balanceInsufficient: boolean;
  couponError?: string;
  defaultSelectedPlanId?: number;
}) {
  useEffect(() => {
    if (balanceInsufficient)
      toast.warn(
        "کاربر گرامی، برای استفاده از سرویس ها لطفا حساب خود را شارژ کنید.",
        { position: "top-center", toastId: "balanceInsufficient" },
      );
  }, [balanceInsufficient]);

  useEffect(() => {
    if (couponError) {
      toast.error(couponError, {
        position: "top-center",
        toastId: "couponError",
      });
    }
  }, [couponError]);

  return (
    <form action={chargeAccountAction} className="w-full h-full">
      <Form {...{ webBalance, plans, defaultSelectedPlanId }} />
    </form>
  );
}
