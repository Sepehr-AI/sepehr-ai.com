export function roundWebPlan(amount: number) {
  return Math.ceil(amount / 1e6) * 1e6;
}

function toPersianDigits(input: number) {
  const englishDigits = "0123456789";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return input
    .toString()
    .split("")
    .map((char) => {
      const index = englishDigits.indexOf(char);
      return index > -1 ? persianDigits[index] : char;
    })
    .join("");
}
export function numberToReadableFarsi(num: number) {
  if (isNaN(num)) {
    return "";
  }

  // Calculate each group
  const million = Math.floor(num / 1000000);
  const thousand = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  const parts = [];

  // Only add part if group is not zero
  if (million) {
    parts.push(`${toPersianDigits(million)} میلیون`);
  }
  if (thousand) {
    parts.push(`${toPersianDigits(thousand)} هزار`);
  }
  // For the remainder, you might want to show it only when non-zero
  if (remainder) {
    parts.push(`${toPersianDigits(remainder)}`);
  }

  // Join groups with " و "
  return parts.join(" و ");
}

export function roundWebCost(cost: number): number {
  return +(Math.ceil((cost + "e+3") as unknown as number) + "e-3");
}

export function roundAiModelCost(cost: number): number {
  return +(Math.ceil((cost + "e+2") as unknown as number) + "e-2");
}

export function usdToCredit(usd: number): number {
  return Math.floor(usd * 1.75 * 1000);
}

export function creditToUsd(credit: number): number {
  // *1000 and /1000 for 3 digit decimal accuracy.
  return Math.floor((credit / 1.75 / 1000) * 1000) / 1000;
}
