import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  error?: string | null;
}

const Table = <T,>({
  data,
  columns,
  keyExtractor,
  isLoading,
  error,
}: TableProps<T>) => {
  return (
    <div className="bg-white rounded-lg shadow-md min-w-full mx-auto flex-grow p-6">
      {isLoading && (
        <div className="flex justify-center py-4">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
            />
          </svg>
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!isLoading && !error && data.length === 0 && (
        <p className="text-gray-500">Нет данных для отображения</p>
      )}
      {data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="p-3 text-left text-sm font-medium text-gray-700 border-b"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-gray-50 border-b last:border-b-0"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="p-3 text-sm text-gray-900">
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Table;
