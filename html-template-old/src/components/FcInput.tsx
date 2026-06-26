import checkmark from "./assets/checkmark.svg";

import { InputHTMLAttributes, useState } from "react";

function FcInputCheckbox({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={`fc-input-checkbox ${className}`}>
      <label className="p-0.5 -m-0.5 cursor-pointer">
        <input className="peer hidden" type={type} {...props} />
        <span className="peer-checked:[&>*]:block fc-circle relative inline-block -top-0.5 w-4 h-4 align-middle">
          <span
            className="hidden absolute left-[10%] top-[-35%] w-[140%] h-[140%] bg-contain"
            style={{ backgroundImage: `url("${checkmark}")` }}
          ></span>
        </span>
      </label>
    </span>
  );
}

function FcInputText({
  className,
  type,
  value,
  defaultValue,
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [_value, setValue] = useState(value ?? defaultValue);

  return (
    <span className={`fc-input-text ${className}`}>
      <span className="relative w-fit whitespace-pre">
        <span className="inline-block px-2 min-w-16 max-w-64 invisible">{_value}</span>
        <input
          className="absolute left-0 right-0 text-center"
          type={type}
          value={_value}
          {...props}
          onChange={onChange ?? ((ev) => setValue(ev.currentTarget.value))}
        />
      </span>
    </span>
  );
}

export default function FcInput({ type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  if (type === "checkbox") {
    return <FcInputCheckbox type={type} {...props} />;
  } else {
    return <FcInputText type={type} {...props} />;
  }
}
