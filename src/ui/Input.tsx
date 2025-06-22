import React from "react";

type InputProps = {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
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

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    className = "",
    placeholder,
    value,
    onChange,
    onKeyDown,
    onBlur,
    onFocus,
    type = "text",
    disabled = false,
    required = false,
    name = "",
    id = "",
  } = props;

  return (
    <input
      ref={ref}
      autoComplete="off"
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      onFocus={onFocus}
      className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${className}`}
    />
  );
});

Input.displayName = "Input";

export default Input;
