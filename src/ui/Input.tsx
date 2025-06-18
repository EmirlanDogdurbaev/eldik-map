import React from "react";

type InputProps = {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "date"
    | "time";
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
};

const Input = (props: InputProps) => {
  const {
    className,
    placeholder,
    value,
    onChange,
    type = "text",
    disabled = false,
    required = false,
    name = "",
    id = "",
  } = props;
  return (
    <input
      autoComplete="off"
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      value={value}
      onChange={onChange}
      className={`w-3xs p-2 border-black border rounded-md focus:outline-none focus:ring-2 focus:border-blue-400 focus:outline-0 ${className}`}
    />
  );
};

export default Input;
