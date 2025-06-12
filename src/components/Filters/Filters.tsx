import type { FilterField } from "../../types/types";
import Input from "../../ui/Input";
import CustomSelect from "../../ui/Select";

interface FiltersProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  className?: string;
}

const Filters: React.FC<FiltersProps> = ({
  fields,
  values,
  onChange,
  className,
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
      {fields.map((field) => (
        <div key={field.key}>
          {field.type === "text" ? (
            <Input
              type="text"
              placeholder={field.placeholder || field.label}
              value={values[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <CustomSelect
              options={field.options || []}
              value={
                field.options?.find(
                  (option) => option.value === values[field.key]
                ) ?? null
              }
              onChange={(option) =>
                onChange(field.key, option ? (option as any).value : "")
              }
              placeholder={field.placeholder || "Выберите..."}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Filters;
