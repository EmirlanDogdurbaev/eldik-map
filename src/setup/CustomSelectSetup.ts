import type { StylesConfig } from "react-select";

interface Option {
  value: string;
  label: string;
}

export const customStyles: StylesConfig<Option, boolean> = {
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
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#f3f4f6"
      : "white",
    color: state.isSelected ? "white" : "#111827",
    "&:hover": {
      backgroundColor: state.isSelected ? "#2563eb" : "#f3f4f6",
      color: state.isSelected ? "white" : "#111827",
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
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#e5e7eb",
    borderRadius: "0.25rem",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#374151",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    "&:hover": {
      backgroundColor: "#ef4444",
      color: "white",
    },
  }),
};
