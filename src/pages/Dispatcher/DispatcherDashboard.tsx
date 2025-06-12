import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetRequestsQuery, type Request } from "../../api/requestsApi";
import Table, { type Column } from "../../components/Table/Table";
import Button from "../../ui/Button";
import Pagination from "../../ui/Pagination";
import Filters from "../../components/Filters/Filters";
import type { FilterField } from "../../types/types";

const DispatcherDashboard: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterValues, setFilterValues] = useState({
    status: "",
    username: "",
  });

  const {
    data: requests = { count: 0, results: [] },
    isLoading,
    error,
  } = useGetRequestsQuery({
    limit,
    offset,
    status:
      filterValues.status !== "" ? Number(filterValues.status) : undefined,
    username: filterValues.username || undefined,
  });

  const columns = useMemo<Column<Request>[]>(
    () => [
      {
        key: "id",
        header: "ID",
        render: ({ id }) => <Link to={`/requests/${id}`}>{id}</Link>,
      },
      {
        key: "date",
        header: "Дата",
        render: ({ date }) => new Date(date).toLocaleDateString("ru-RU"),
      },
      { key: "user", header: "Пользователь", render: ({ user }) => user },
      {
        key: "comments",
        header: "Комментарии",
        render: ({ comments }) => comments || "Нет комментариев",
      },
      {
        key: "status",
        header: "Статус",
        render: ({ status_text }) => status_text,
      },
      {
        key: "view",
        header: "Посмотреть более",
        render: ({ id }) => (
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            <Link to={`/requests/${id}`}>Посмотреть детали</Link>
          </Button>
        ),
      },
    ],
    []
  );

  const filterFields: FilterField[] = [
    {
      type: "select",
      key: "status",
      label: "Статус",
      placeholder: "Все статусы",
      options: [
        { value: "0", label: "В процессе" },
        { value: "1", label: "Одобрено" },
        { value: "2", label: "Отклонена" },
      ],
    },
    {
      type: "text",
      key: "username",
      label: "Имя пользователя",
      placeholder: "Введите имя...",
    },
  ];

  const errorMessage =
    error && "status" in error
      ? `${error.status} ${JSON.stringify(error.data)}`
      : error
      ? "Неизвестная ошибка"
      : null;

  return (
    <div
      className="px-3 py-4 mx-auto"
      style={{ maxWidth: 1400, minWidth: 1400, width: "100%" }}
    >
      <h2 className="text-2xl font-bold mb-6">Панель диспетчера</h2>

      <Filters
        fields={filterFields}
        values={filterValues}
        className="mb-6"
        onChange={(key, value) => {
          setOffset(0);
          setFilterValues((prev) => ({ ...prev, [key]: value }));
        }}
      />

      <Table
        data={requests.results}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        error={errorMessage}
        limit={limit}
      />

      {requests.count > limit && (
        <Pagination
          limit={limit}
          offset={offset}
          count={requests.count}
          onLimitChange={setLimit}
          onOffsetChange={setOffset}
        />
      )}
    </div>
  );
};

export default DispatcherDashboard;
