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
  className = "",
}) => {
  const activeFiltersCount = Object.values(values).filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0;

  const clearAllFilters = () => {
    fields.forEach((field) => onChange(field.key, ""));
  };

  const clearSingleFilter = (key: string) => {
    onChange(key, "");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Фильтры</h3>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFiltersCount}
              </span>
              <span className="text-sm text-gray-600">активных</span>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group"
          >
            <svg
              className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Сбросить все
          </button>
        )}
      </div>

      {/* Контейнер фильтров */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field, index) => {
            const hasValue = Boolean(values[field.key]);

            return (
              <div
                key={field.key}
                className="group relative"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {field.label && (
                  <label className="block text-sm font-medium text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                )}

                <div className="relative">
                  {field.type === "text" ? (
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder={field.placeholder || field.label}
                        value={values[field.key] || ""}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        className={`
                          w-full p-3 pr-10 border rounded-lg transition-all duration-200
                          bg-gray-50 text-gray-900 
                          placeholder-gray-500 
                          hover:bg-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          ${
                            hasValue
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-300"
                          }
                        `}
                      />
                      {hasValue && (
                        <button
                          onClick={() => clearSingleFilter(field.key)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
                          aria-label="Очистить"
                          type="button"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <CustomSelect
                        options={field.options || []}
                        value={
                          field.options?.find(
                            (option) => option.value === values[field.key]
                          ) ?? null
                        }
                        onChange={(option) =>
                          onChange(
                            field.key,
                            option && "value" in option
                              ? String(option.value)
                              : ""
                          )
                        }
                        placeholder={field.placeholder || "Выберите..."}
                      />
                    </div>
                  )}

                  {hasValue && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
                  )}
                </div>

                {field.hint && (
                  <p className="mt-1 text-xs text-gray-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
                    {field.hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
              />
            </svg>
            <p>Фильтры не настроены</p>
          </div>
        )}
      </div>

      {/* Активные фильтры */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 py-1">Активные фильтры:</span>
          {Object.entries(values)
            .filter(([, value]) => Boolean(value))
            .map(([key, value]) => {
              const field = fields.find((f) => f.key === key);
              const displayValue =
                field?.type === "select"
                  ? field.options?.find((opt) => opt.value === value)?.label ||
                    value
                  : value;

              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
                >
                  <span className="font-medium">{field?.label}:</span>
                  <span>{displayValue}</span>
                  <button
                    onClick={() => clearSingleFilter(key)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    aria-label={`Удалить фильтр ${field?.label}`}
                    type="button"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Filters;
