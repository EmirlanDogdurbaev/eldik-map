import { useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useGetRequestByIdQuery,
  type Route,
  useGetDriversQuery,
  useUpdateRequestMutation,
} from "../../api/requestsApi";
import { toast, ToastContainer } from "react-toastify";
import Button from "../../ui/Button";
import CustomSelect from "../../ui/Select";
import RejectModal from "../../ui/RejectModal";
import { ArrowLeft } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

// Статусы для преобразования
const STATUS_MAP = {
  created: 0,
  approved: 1,
  rejected: 2,
};

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    data: request,
    isLoading,
    error,
    refetch,
  } = useGetRequestByIdQuery(id || "");
  const [updateRequest, { isLoading: isUpdating }] = useUpdateRequestMutation();
  const { data: driversData } = useGetDriversQuery({ limit: 100 });

  const [selectedDrivers, setSelectedDrivers] = useState<
    Record<string, Option>
  >({});
  const [comment, setComment] = useState("");
  const [showReject, setShowReject] = useState(false);

  const drivers: Option[] = (driversData?.results || []).map((d) => ({
    value: d.id,
    label: d.user,
  }));

  const handleApprove = async () => {
    const driverIds = Object.fromEntries(
      Object.entries(selectedDrivers).map(([routeId, driver]) => [
        routeId,
        driver.value,
      ])
    );

    if (!Object.keys(driverIds).length) {
      toast.error("Выберите водителя для каждого маршрута", {
        position: "top-right",
      });
      return;
    }

    try {
      await updateRequest({
        id: id || "",
        status: STATUS_MAP.approved,
        drivers: driverIds,
      }).unwrap();
      toast.success("Заявка одобрена", { position: "top-right" });
      setSelectedDrivers({});
      await refetch();
    } catch (err: any) {
      toast.error(err.data?.detail || "Ошибка при подтверждении", {
        position: "top-right",
      });
      console.error("Approve error:", err);
    }
  };

  const handleReject = useCallback(
    async (reason: string) => {
      // Принимаем reason напрямую
      console.log("Attempting to reject with reason:", reason);
      try {
        console.log("Sending reject request with reason:", reason);
        const result = await updateRequest({
          id: id || "",
          status: STATUS_MAP.rejected,
          comments: reason, // Используем переданный reason
        }).unwrap();
        console.log("Reject success, result:", result);
        toast.success("Заявка отклонена", { position: "top-right" });
        setComment("");
        setShowReject(false);
        await refetch();
      } catch (err: any) {
        console.error("Reject error:", err);
        toast.error(err.data?.detail || "Ошибка при отклонении", {
          position: "top-right",
        });
      }
    },
    [id, updateRequest, refetch]
  ); // Убрали comment из зависимостей

  const allDriversSelected =
    request?.routes?.every((r) => selectedDrivers[r.id]) ?? false;

  if (isLoading)
    return <div className="flex justify-center p-4">Загрузка...</div>;
  if (error || !request)
    return <div className="text-red-500 p-4">Ошибка загрузки</div>;

  return (
    <div className="p-6 min-w-7xl mx-auto">
      <div>
        <Link
          to="/dispatcher"
          className="text-blue-500 hover:underline mb-4 inline-flex items-center"
        >
          <ArrowLeft /> Вернуться назад
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-6">Детали заявки #{request.id}</h2>
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <p>
          <strong>Дата:</strong> {new Date(request.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Пользователь:</strong> {request.user}
        </p>
        <p>
          <strong>Статус:</strong> {request.status_text}
        </p>
        <p>
          <strong>Комментарии:</strong> {request.comments || "Нет комментариев"}
        </p>
        <p>
          <strong>Водитель:</strong>{" "}
          {request.driver
            ? drivers.find((d) => d.value === request.driver)?.label
            : "Не назначен"}
        </p>
      </div>

      {request.routes?.map((route: Route) => (
        <div key={route.id} className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Маршрут</h3>
          <table className="w-full bg-white border rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Цель</th>
                <th className="p-2 text-left">Отправление</th>
                <th className="p-2 text-left">Назначение</th>
                <th className="p-2 text-left">Время</th>
                <th className="p-2 text-left">Использование</th>
                <th className="p-2 text-left">Водитель</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t hover:bg-gray-50">
                <td className="p-2 min-w-52 text-left">
                  {route.goal || "Не указана"}
                </td>
                <td className="p-2 min-w-52 text-left">
                  {route.departure || "Не указано"}
                </td>
                <td className="p-2 min-w-52 text-left">
                  {route.destination || "Не указано"}
                </td>
                <td className="p-2 min-w-42 text-left">{route.time}</td>
                <td className="p-2 min-w-42 text-left">{route.usage_count}</td>
                <td className="p-2 min-w-72 text-left">
                  <CustomSelect
                    options={drivers}
                    value={selectedDrivers[route.id] || null}
                    onChange={(newValue) =>
                      setSelectedDrivers((prev) => ({
                        ...prev,
                        [route.id]: newValue as Option,
                      }))
                    }
                    placeholder="Выберите водителя"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      <div className="mt-4 space-x-2 flex justify-end">
        <Button
          onClick={handleApprove}
          disabled={isLoading || !allDriversSelected}
          className="bg-green-500 hover:bg-green-600 py-4 px-6 text-white"
        >
          Одобрить
        </Button>
        <Button
          onClick={() => setShowReject(true)}
          disabled={isLoading}
          className="bg-red-500 hover:bg-red-600 py-4 px-6 text-white"
        >
          Отклонить
        </Button>
      </div>

      {showReject && (
        <RejectModal
          comment={comment}
          onChange={setComment}
          onConfirm={handleReject}
          onCancel={() => setShowReject(false)}
          isLoading={isUpdating}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default RequestDetail;
