import React, { useState } from "react";

function InputWithValue({
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
      {...props}
    />
  );
}

export default InputWithValue;
