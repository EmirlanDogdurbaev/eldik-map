import Input from "../../ui/Input";

interface FilterField {
  type: "text" | "select";
  key: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface FiltersProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const Filters: React.FC<FiltersProps> = ({ fields, values, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <select
              value={values[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{field.placeholder || "Все"}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
};

export default Filters;
