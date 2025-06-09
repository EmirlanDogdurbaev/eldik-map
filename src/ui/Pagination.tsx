import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  limit: number;
  offset: number;
  count: number;
  onLimitChange: (newLimit: number) => void;
  onOffsetChange: (newOffset: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  limit,
  offset,
  count,
  onOffsetChange,
}) => {
  const totalPages = Math.ceil(count / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="flex items-center justify-end mt-9">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOffsetChange(offset - limit)}
          disabled={offset === 0}
          className="p-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-gray-700">
          Страница {currentPage} из {totalPages}
        </span>
        <button
          onClick={() => onOffsetChange(offset + limit)}
          disabled={offset + limit >= count}
          className="p-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
