import React from "react";
import ReactSelect, { type StylesConfig } from "react-select";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value?: Option | null;
  onChange: (value: Option | null) => void;
  placeholder?: string;
  isMulti?: boolean;
}

const customStyles: StylesConfig<Option, boolean> = {
  control: (provided) => ({
    ...provided,
    border: "1px solid #d1d5db",
    borderRadius: "0.375rem",
    padding: "0.25rem",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#d1d5db",
    },
    "&:focus-within": {
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)",
    },
  }),
  option: (provided) => ({
    ...provided,
    backgroundColor: "white",
    "&:hover": {
      backgroundColor: "#f3f4f6",
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.375rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#374151",
  }),
};

const CustomSelect: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Выберите...",
  isMulti = false,
}) => {
  return (
    <ReactSelect
      options={options}
      value={value}
      onChange={(newValue) => {
        if (Array.isArray(newValue)) {
          onChange(null);
        } else {
          onChange(newValue as Option | null);
        }
      }}
      placeholder={placeholder}
      isMulti={isMulti}
      styles={customStyles}
      className="w-full"
      classNamePrefix="react-select"
    />
  );
};

export default CustomSelect;
