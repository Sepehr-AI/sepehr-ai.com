const digitsMap = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFarsiDigits(num: number): string {
  return num
    .toString()
    .replace(/\d/g, (digit: string) => digitsMap[parseInt(digit, 10)]);
}
