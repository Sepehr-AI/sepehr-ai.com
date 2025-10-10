"use client";

import { toast } from "react-toastify";
import { usdToCredit } from "@/lib/cost";
import { CiDollar } from "react-icons/ci";
import { useFormStatus } from "react-dom";
import Loading from "@/components/Loading";
import { useEffect, useState } from "react";
import { chargeAccountAction } from "./actions";
import type { WebPlansForUsers } from "@/lib/plans";
import { extractDiscountInfo } from "@/lib/discount";

function Form({
  plans,
  webBalance,
}: {
  webBalance: number;
  plans: WebPlansForUsers;
}) {
  const { pending } = useFormStatus();
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);

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
                onClick={() => setSelectedPlanId(index)}
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
                    <span className="px-3 py-2 bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900 rounded-full font-semibold">
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

              <div className="flex">
                <div className="flex items-center justify-between gap-4">
                  <span className="hidden md:block text-foreground/70">
                    مبلغ قابل پرداخت:
                  </span>
                </div>
                <div className="flex flex-auto gap-2">
                  <div className="md:flex-auto"></div>
                  <button
                    type="submit"
                    className="flex-1/3 md:hidden w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg transition-colors"
                  >
                    پرداخت
                  </button>
                  <div className="flex-auto"></div>
                  <span className="content-center flex-none font-medium">
                    <span>
                      {plans[selectedPlanId].discountedDisplayPrice
                        ? plans[selectedPlanId].discountedDisplayPrice
                        : plans[selectedPlanId].displayPrice}{" "}
                    </span>
                    <span className="text-foreground/70 mr-1">تومان</span>
                  </span>
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
}: {
  webBalance: number;
  plans: WebPlansForUsers;
  balanceInsufficient: boolean;
}) {
  useEffect(() => {
    if (balanceInsufficient)
      toast.warn(
        "کاربر گرامی، برای استفاده از سرویس ها لطفا حساب خود را شارژ کنید.",
        { position: "top-center", toastId: "balanceInsufficient" },
      );
  }, [balanceInsufficient]);

  return (
    <form action={chargeAccountAction} className="w-full h-full">
      <Form {...{ webBalance, plans }} />
    </form>
  );
}
