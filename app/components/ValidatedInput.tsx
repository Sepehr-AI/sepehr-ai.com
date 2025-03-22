import {
  useState,
  useCallback,
  ChangeEvent,
  DetailedHTMLProps,
  InputHTMLAttributes,
  useEffect,
  Ref,
} from "react";

function convertToEnglishDigits(input: string): string {
  return input.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (match) => {
    const code = match.charCodeAt(0);
    // Arabic digits (U+0660 to U+0669)
    if (code >= 0x0660 && code <= 0x0669) {
      return String.fromCharCode(code - 0x0660 + 48);
    }
    // Persian digits (U+06F0 to U+06F9)
    if (code >= 0x06f0 && code <= 0x06f9) {
      return String.fromCharCode(code - 0x06f0 + 48);
    }
    return match;
  });
}

export default function ValidatedInput({
  name,
  dir = "rtl",
  value: _value,
  align = "right",
  convertFarsiNumbersToEnglish = false,
  ...props
}: {
  name: string;
  dir?: "auto" | "ltr" | "rtl";
  convertFarsiNumbersToEnglish?: boolean;
  align?: "right" | "left" | "center" | "auto";
} & DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) {
  const [value, setValue] = useState(_value || "");
  const [direction, setDirection] = useState(
    !_value && dir === "auto" ? "rtl" : dir
  );
  const [textAlign, setTextAlign] = useState(
    !_value && align === "auto" ? "rtl" : align
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.currentTarget.value;
    if (convertFarsiNumbersToEnglish) val = convertToEnglishDigits(val);

    setValue(val);
    if (dir === "auto") {
      if (val && val.length) {
        setDirection("ltr");
        if (align === "auto") setTextAlign("ltr");
      } else {
        setDirection("rtl");
        if (align === "auto") setTextAlign("rtl");
      }
    }
  };

  return (
    <input
      id={name}
      name={name}
      value={value}
      onChange={handleChange}
      style={{ textAlign, direction } as any}
      {...props}
    />
  );
}
