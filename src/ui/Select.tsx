import React from "react";
import ReactSelect, { type SingleValue, type MultiValue } from "react-select";
import { customStyles } from "../setup/CustomSelectSetup";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value?: Option | Option[] | null;
  onChange: (value: Option | Option[] | null) => void;
  placeholder?: string;
  isMulti?: boolean;
}

const CustomSelect: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Выберите...",
  isMulti = false,
}) => {
  const handleChange = (newValue: SingleValue<Option> | MultiValue<Option>) => {
    if (isMulti) {
      onChange(newValue as Option[] | null);
    } else {
      onChange(newValue as Option | null);
    }
  };

  return (
    <ReactSelect
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      isMulti={isMulti}
      styles={customStyles}
      className="w-full"
      classNamePrefix="react-select"
    />
  );
};

export default CustomSelect;
