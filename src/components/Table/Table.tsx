import type { ReactNode } from "react";

export interface Column<T> {
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
  limit?: number;
}

const Table = <T,>({
  data,
  columns,
  keyExtractor,
  isLoading,
  error,
  limit = 10,
}: TableProps<T>) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
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
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  const rowHeight = 60;
  const headerHeight = 60;
  const tableHeight = headerHeight + Math.min(limit, data.length) * rowHeight;

  return (
    <div
      className=" border border-gray-200 rounded-md shadow-sm"
      style={{ maxHeight: `${tableHeight}px` }}
    >
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className="p-3 text-center text-gray-700 font-semibold"
                style={{ height: `${headerHeight}px` }}
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
              className="border-t hover:bg-gray-50"
              style={{ height: `${rowHeight}px` }}
            >
              {columns.map((column) => (
                <td key={column.key} className="p-2 px-5 text-gray-700 text-center">
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
          {data.length < limit &&
            Array.from({ length: limit - data.length }).map((_, index) => (
              <tr
                key={`empty-${index}`}
                className="border-t"
                style={{ height: `${rowHeight}px` }}
              >
                {columns.map((column) => (
                  <td key={column.key} className="p-2"></td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
