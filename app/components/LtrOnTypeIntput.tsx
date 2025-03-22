import { useState } from "react";

export default function LtrOnTypeInput({
  value: _value,
  ...props
}: { value?: string } & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) {
  const [value, setValue] = useState(_value || "");

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{ direction: value && value.length ? "ltr" : "rtl" }}
      {...props}
    />
  );
}
