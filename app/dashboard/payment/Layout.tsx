"use client";

import { useState } from "react";
import { CiDollar } from "react-icons/ci";
import { roundWebCost } from "@/lib/cost";
import { WebPlans } from "@prisma/client";
import { chargeAccount } from "./actions";

export default function PaymentLayout({
  plans,
  webBalance,
}: {
  webBalance: number;
  plans: WebPlans[];
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<number>(0);

  return (
    <div className="flex-auto flex items-center justify-center p-4">
      <form
        action={chargeAccount}
        className="items-center justify-center lg:rounded-3xl lg:shadow-gray-400 lg:shadow-2xl lg:p-8"
      >
        {/* Credit Balance Section */}
        <h2 className="text-3xl text-center font-bold mb-3">
          میزان اعتبار شما
        </h2>
        <p className="text-4xl text-center flex justify-center gap-1">
          <span>{roundWebCost(webBalance)}</span>
          <CiDollar />
        </p>

        {/* Plans Section */}
        <div className="p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">
            انتخاب طرح شارژ
          </h2>
          <div className="grid grid-cols-3 gap-2 md:gap-4 xl:gap-6">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`border-2 rounded-xl py-4 px-5 cursor-pointer transition-transform duration-200 transform hover:scale-105 ${
                  selectedPlanId === index
                    ? "border-gray-500 bg-gay-100"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedPlanId(index)}
              >
                <p className="text-center mb-4">{plan.name}</p>
                <p className="text-xl text-center font-semibold text-gray-700">
                  <span>{plan.credits + " "}</span>
                  <span>اعتبار</span>
                </p>
              </div>
            ))}
          </div>
          <p className="my-6">
            <span>مبلغ قابل پرداخت: </span>
            <span>{plans[selectedPlanId].displayPrice}</span>
            <span> تومان + ۹٪ مالیات</span>
          </p>
          <input type="hidden" name="planId" value={plans[selectedPlanId].id} />
          <button
            type="submit"
            className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 px-6 rounded-xl shadow-lg transition-colors"
          >
            پرداخت
          </button>
        </div>
      </form>
    </div>
  );
}
