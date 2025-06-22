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
  onChange: (value: SingleValue<Option> | MultiValue<Option>) => void;
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
    onChange(newValue);
  };

  return (
    <ReactSelect
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      isMulti={isMulti}
      styles={customStyles}
    />
  );
};

export default CustomSelect;
