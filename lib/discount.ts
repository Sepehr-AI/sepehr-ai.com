import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.tz.setDefault("Asia/Tehran");

export function extractDiscountInfo({
  discountEndsOn,
  discountPercentage,
  discountedDisplayPrice,
}: {
  discountEndsOn: Date | null;
  discountPercentage: number | null;
  discountedDisplayPrice: string | null;
}) {
  const tehranNow = dayjs().tz("Asia/Tehran");
  const dayJsDiscountEndsOn =
    discountEndsOn && discountedDisplayPrice
      ? dayjs(discountEndsOn).tz("Asia/Tehran")
      : null;
  let diffInFarsi: string | null = null;
  const discountPercent = discountPercentage || 0;

  if (dayJsDiscountEndsOn) {
    const diff = dayjs.duration(dayJsDiscountEndsOn.diff(tehranNow));
    const days = diff.days();
    const hours = diff.hours();
    diffInFarsi =
      days > 0
        ? hours > 0
          ? `${days} روز و ${hours} ساعت`
          : `${days} روز`
        : hours > 0
          ? `${hours} ساعت`
          : null;
  }

  return {
    diffInFarsi,
    discountEndsOn,
    discountPercent,
    hasDiscount: diffInFarsi !== null,
  };
}

export function normalizeCouponCode(
  input: string | null | undefined,
): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.toUpperCase();
}

export function computeCouponDiscountRial(
  couponAmountStr: string,
  basePriceRial: number,
): number {
  const s = couponAmountStr.trim();
  if (s.endsWith("%")) {
    const pct = parseFloat(s.slice(0, -1));
    if (!isFinite(pct) || pct <= 0) return 0;
    // percentage of rial price
    return Math.floor((basePriceRial * pct) / 100);
  } else {
    const fixedToman = parseFloat(s);
    if (!isFinite(fixedToman) || fixedToman <= 0) return 0;
    // convert toman -> rial
    return Math.round(fixedToman * 10);
  }
}
