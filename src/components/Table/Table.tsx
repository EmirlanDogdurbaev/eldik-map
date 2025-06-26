import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-300 rounded-full animate-spin animate-reverse"></div>
            </div>
            <p className="text-gray-500 font-medium">Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ошибка загрузки
              </h3>
              <p className="text-red-600 max-w-md">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Нет данных
              </h3>
              <p className="text-gray-500">Записи для отображения не найдены</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getAlignmentClass = (align?: string) => {
    switch (align) {
      case "left":
        return "text-left justify-start";
      case "right":
        return "text-right justify-end";
      default:
        return "text-center justify-center";
    }
  };

  const rowHeight = 64;
  const headerHeight = 56;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div
        className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200"
        style={{ height: `${headerHeight}px` }}
      >
        <div
          className="grid grid-cols-[repeat(var(--cols),1fr)] gap-0 h-full"
          style={{ "--cols": columns.length } as React.CSSProperties}
        >
          {columns.map((column, index) => (
            <div
              key={column.key}
              className={`
                px-3 font-semibold text-gray-700 text-sm uppercase tracking-wider
                flex items-center
                ${getAlignmentClass(column.align)}
                ${
                  index !== columns.length - 1 ? "border-r border-gray-200" : ""
                }
                transition-colors duration-200 hover:bg-gray-100
              `}
              style={{
                width: column.width,
                height: `${headerHeight}px`,
              }}
            >
              <div className="flex items-center w-full">{column.header}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {Array.from({ length: limit }).map((_, rowIndex) => {
          const item = data[rowIndex];
          const isEmpty = !item;

          return (
            <div
              key={isEmpty ? `empty-${rowIndex}` : keyExtractor(item)}
              className={`
                grid grid-cols-[repeat(var(--cols),1fr)] gap-0 group
                ${
                  !isEmpty
                    ? "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
                    : ""
                }
                transition-all duration-200 ease-in-out
                ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
              `}
              style={
                {
                  "--cols": columns.length,
                  height: `${rowHeight}px`,
                } as React.CSSProperties
              }
            >
              {columns.map((column, colIndex) => (
                <div
                  key={column.key}
                  className={`
                    px-4 text-gray-700
                    flex items-center
                    ${getAlignmentClass(column.align)}
                    ${
                      colIndex !== columns.length - 1
                        ? "border-r border-gray-100 group-hover:border-blue-100"
                        : ""
                    }
                    transition-all duration-200
                  `}
                  style={{
                    width: column.width,
                    height: `${rowHeight}px`,
                  }}
                >
                  <div className="flex items-center w-full">
                    {!isEmpty ? column.render(item) : null}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Отображено {data.length} из {data.length} записей
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Данные актуальны</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;
