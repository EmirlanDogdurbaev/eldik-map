import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetRequestsQuery, type Request } from "../../api/requestsApi";
import Table, { type Column } from "../../components/Table/Table";
import Button from "../../ui/Button";
import Pagination from "../../ui/Pagination";
import Filters from "../../components/Filters/Filters";
import { Eye, Calendar, User, MessageSquare, FileText } from "lucide-react";
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

  const getStatusBadge = (statusText: string) => {
    const statusMap: Record<
      string,
      { bg: string; text: string; icon: string }
    > = {
      "В ожидании": {
        bg: "bg-yellow-100 text-yellow-800",
        text: "В ожидании",
        icon: "⏳",
      },
      Одобрено: {
        bg: "bg-green-100 text-green-800",
        text: "Одобрено",
        icon: "✅",
      },
      Отклонено: {
        bg: "bg-red-100 text-red-800",
        text: "Отклонено",
        icon: "❌",
      },
      "В обработке": {
        bg: "bg-blue-100 text-blue-800",
        text: "В обработке",
        icon: "🔄",
      },
    };

    const status = statusMap[statusText] || {
      bg: "bg-gray-100 text-gray-800",
      text: statusText,
      icon: "📋",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.bg}`}
      >
        <span>{status.icon}</span>
        {status.text}
      </span>
    );
  };

  const columns = useMemo<Column<Request>[]>(
    () => [
      {
        key: "date",
        header: "Дата создания",
        render: ({ date }) => (
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-medium">
              {new Date(date).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
        ),
      },
      {
        key: "user",
        header: "Пользователь",
        render: ({ user }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-900">{user}</span>
          </div>
        ),
      },
      {
        key: "comments",
        header: "Комментарии",
        render: ({ comments }) => (
          <div className="flex items-center gap-2 max-w-xs">
            <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">
              {comments || "Комментарии отсутствуют"}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Статус заявки",
        render: ({ status_text }) => getStatusBadge(status_text),
      },
      {
        key: "actions",
        header: "Действия",
        render: ({ id }) => (
          <Link to={`/requests/${id}`}>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-medium">
              <Eye className="w-4 h-4" />
              Подробности
            </Button>
          </Link>
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
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Панель диспетчера
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Управляйте заявками и отслеживайте их статус
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Всего заявок
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.count}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  На текущей странице
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.results.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Страница</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(offset / limit) + 1} из{" "}
                  {Math.ceil(requests.count / limit)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Filters
            fields={filterFields}
            values={filterValues}
            onChange={(key, value) => {
              setOffset(0);
              setFilterValues((prev) => ({ ...prev, [key]: value }));
            }}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Список заявок
            </h3>
          </div>

          <Table
            data={requests.results}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            error={errorMessage}
            limit={limit}
          />
        </div>

        {requests.count > limit && (
          <div className="mt-6 flex justify-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <Pagination
                limit={limit}
                offset={offset}
                count={requests.count}
                onLimitChange={setLimit}
                onOffsetChange={setOffset}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && requests.results.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Заявки не найдены
            </h3>
            <p className="text-gray-600">
              {filterValues.status || filterValues.username
                ? "Попробуйте изменить фильтры поиска"
                : "Заявки еще не были созданы"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatcherDashboard;
