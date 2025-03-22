const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export const numberToEnglish = (val: any) =>
  Array.from(val.toString())
    .map((c: any) => {
      const pIdx = persianNumbers.indexOf(c);
      if (pIdx !== -1) return pIdx;
      const aIdx = arabicNumbers.indexOf(c);
      if (aIdx !== -1) return aIdx;

      return c;
    })
    .join("");
