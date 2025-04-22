"use client";

import { toast } from "react-toastify";
import { CiDollar } from "react-icons/ci";
import { useEffect, useState } from "react";
import { chargeAccountAction } from "./actions";
import type { WebPlansForUsers } from "@/lib/plans";
import { roundWebCost, usdToCredit } from "@/lib/cost";

export default function PaymentLayout({
  plans,
  webBalance,
  balanceInsufficient,
}: {
  webBalance: number;
  plans: WebPlansForUsers;
  balanceInsufficient: boolean;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);

  useEffect(() => {
    if (balanceInsufficient)
      toast.warn(
        "کاربر گرامی، برای استفاده از سرویس ها لطفا حساب خود را شارژ کنید.",
        { position: "top-center", toastId: "balanceInsufficient" },
      );
  }, [balanceInsufficient]);

  return (
    <div className="flex flex-col my-auto px-2">
      {/* Main content */}
      <div
        className="justify-center content-center max-w-xl mx-auto flex-auto shrink overflow-y-auto my-auto bg-card border border-border rounded-xl p-6 shadow-sm"
        style={{ scrollbarWidth: "none" }}
      >
        <form action={chargeAccountAction} className="space-y-6">
          {/* Credit Balance Section */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold mb-3">میزان اعتبار شما</h2>
            <div className="flex items-center justify-center gap-1 text-3xl font-bold text-accent">
              <span>{roundWebCost(webBalance)}</span>
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
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="hidden md:block text-foreground/70">
                    مبلغ قابل پرداخت:
                  </span>
                  <button
                    type="submit"
                    className="flex-1/3 md:hidden w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg transition-colors"
                  >
                    پرداخت
                  </button>
                  <span className="font-medium">
                    <span>{plans[selectedPlanId].displayPrice} </span>
                    <span className="text-foreground/70 mr-1">
                      تومان + ۹٪ مالیات
                    </span>
                  </span>
                  <div></div>
                </div>
              </div>
            </div>

            <input
              type="hidden"
              name="planId"
              value={plans[selectedPlanId].id}
            />

            <button
              type="submit"
              className="hidden md:block w-full bg-accent hover:bg-accent/90 text-white py-3 px-6 rounded-lg transition-colors"
            >
              پرداخت
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
