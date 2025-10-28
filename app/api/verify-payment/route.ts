/* eslint-disable @typescript-eslint/no-explicit-any */
import { roundWebPlan } from "@/lib/cost";
import { extractDiscountInfo } from "@/lib/discount";
import { computeCouponDiscountRial } from "@/lib/discount";
import getExchangeRate from "@/lib/exchange";
import { error } from "@/lib/log";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 20;

function normalizeCouponCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      planId?: number;
      couponCode?: string;
    } | null;

    const planId = Number(body?.planId);
    const normalizedCode = normalizeCouponCode(body?.couponCode);

    if (!planId || !normalizedCode) {
      return NextResponse.json(
        { ok: false, error: "ورودی نامعتبر است." },
        { status: 400 },
      );
    }

    const plan = await prisma.webPlan.findUnique({
      where: { id: planId },
      select: {
        usdPrice: true,
        usdCredits: true,
        discountPercentage: true,
        discountEndsOn: true,
      },
    });
    if (!plan) {
      return NextResponse.json(
        { ok: false, error: "پلن نامعتبر است." },
        { status: 404 },
      );
    }

    const exchangeRate = await getExchangeRate();

    // Base price after seasonal discount (rial)
    const { hasDiscount } = extractDiscountInfo({
      ...plan,
      discountedDisplayPrice: String(plan.usdPrice),
    });
    const originalPriceRial = roundWebPlan(plan.usdPrice * exchangeRate);
    const basePriceRial = hasDiscount
      ? roundWebPlan(
          originalPriceRial -
            (originalPriceRial * (plan.discountPercentage || 0)) / 100,
        )
      : originalPriceRial;

    // Case-insensitive coupon lookup
    const coupon = await prisma.discountCoupon.findFirst({
      where: { code: { equals: normalizedCode, mode: "insensitive" } },
    });
    if (!coupon) {
      return NextResponse.json(
        { ok: false, error: "کد تخفیف نامعتبر است." },
        { status: 404 },
      );
    }

    // Expiry check
    if (coupon.endsOn && coupon.endsOn.getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "کد تخفیف منقضی شده است." },
        { status: 400 },
      );
    }

    // Capacity: count successful + pending to reduce oversubscription
    const [successful, pending] = await Promise.all([
      prisma.transaction.count({ where: { couponId: coupon.id, respCode: 0 } }),
      prisma.transaction.count({
        where: { couponId: coupon.id, respCode: null },
      }),
    ]);
    const usedLike = successful + pending;
    if (usedLike >= coupon.usageCapacity) {
      return NextResponse.json(
        { ok: false, error: "ظرفیت استفاده از این کد به پایان رسیده است." },
        { status: 400 },
      );
    }

    const discountRial = computeCouponDiscountRial(
      coupon.amount,
      basePriceRial,
    );
    const finalPriceRial =
      Math.floor(Math.max(0, basePriceRial - discountRial) / 1e4) * 1e4;

    return NextResponse.json({
      ok: true,
      basePriceRial,
      discountRial,
      finalPriceRial,
    });
  } catch (e: any) {
    error("PaymentVerificationError", { error: e });
    return NextResponse.json(
      { ok: false, error: "بروز خطا در اعتبارسنجی کد تخفیف." },
      { status: 500 },
    );
  }
}
