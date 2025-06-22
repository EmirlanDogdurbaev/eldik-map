import { useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useGetRequestByIdQuery,
  type Route,
  useGetDriversQuery,
  useGetDriverByNameAndRoleQuery,
  useUpdateRequestMutation,
} from "../../api/requestsApi";
import { toast, ToastContainer } from "react-toastify";
import Button from "../../ui/Button";
import CustomSelect from "../../ui/Select";
import RejectModal from "../../ui/RejectModal";
import { ArrowLeft } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";

interface Option {
  value: string;
  label: string;
}

const STATUS_MAP = {
  created: 0,
  approved: 1,
  rejected: 2,
};

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    data: request,
    isLoading: isRequestLoading,
    error: requestError,
    refetch,
  } = useGetRequestByIdQuery(id || "");
  const [updateRequest, { isLoading: isUpdating }] = useUpdateRequestMutation();
  const { data: driversData, isLoading: isDriversLoading } = useGetDriversQuery(
    {
      limit: 100,
    }
  );

  console.log("Загрузка данных заявки:", driversData);

  const [selectedDrivers, setSelectedDrivers] = useState<
    Record<string, Option | null>
  >({});
  const [comment, setComment] = useState("");
  const [showReject, setShowReject] = useState(false);

  const drivers: Option[] = (driversData?.results || []).map((d) => ({
    value: d.user,
    label: d.user,
  }));

  const selectedDriverName = Object.values(selectedDrivers)[0]?.label;
  const {
    data: driverData,
    isLoading: isDriverIdLoading,
    error: driverIdError,
  } = useGetDriverByNameAndRoleQuery(
    selectedDriverName
      ? { name: selectedDriverName, role: "driver" }
      : skipToken
  );

  const driverId = driverData?.results?.[0]?.id;

  console.log("Список водителей:", drivers);
  console.log("Выбранные водители:", selectedDrivers);
  console.log("Данные водителя из /users/:", driverData);
  console.log("ID водителя:", driverId);

  const handleApprove = async () => {
    if (request?.status === STATUS_MAP.approved) {
      toast.info("Заявка уже одобрена", { position: "top-right" });
      return;
    }

    const driverNames = Object.values(selectedDrivers)
      .filter((driver): driver is Option => driver !== null)
      .map((driver) => driver.label);

    if (driverNames.length === 0) {
      toast.error("Выберите водителя для маршрута", { position: "top-right" });
      return;
    }

    const uniqueDriverNames = new Set(driverNames);
    if (uniqueDriverNames.size > 1) {
      toast.error("Для всех маршрутов должен быть выбран один водитель", {
        position: "top-right",
      });
      return;
    }

    const allRoutesHaveDrivers =
      request?.routes?.every((route) => selectedDrivers[route.id]) ?? false;

    if (!allRoutesHaveDrivers) {
      toast.error("Выберите водителя для каждого маршрута", {
        position: "top-right",
      });
      return;
    }

    if (!driverId) {
      toast.error("ID водителя не найден в базе данных", {
        position: "top-right",
      });
      console.error("Ошибка: driverId не определен");
      return;
    }

    try {
      console.log("Отправляем запрос updateRequest:", {
        id: id || "",
        status: STATUS_MAP.approved,
        driver: driverId,
      });

      await updateRequest({
        id: id || "",
        status: STATUS_MAP.approved,
        driver: driverId,
      }).unwrap();

      toast.success("Заявка одобрена", { position: "top-right" });
      setSelectedDrivers({});
      await refetch();
    } catch (err: any) {
      console.error("Ошибка при одобрении:", err);
      const errorMessage =
        err.data?.driver?.[0] || err.data?.detail || "Ошибка при подтверждении";
      toast.error(errorMessage, { position: "top-right" });
    }
  };

  const handleReject = useCallback(
    async (reason: string) => {
      try {
        console.log("Отправляем запрос на отклонение:", {
          id: id || "",
          status: STATUS_MAP.rejected,
          comments: reason,
        });

        await updateRequest({
          id: id || "",
          status: STATUS_MAP.rejected,
          comments: reason,
        }).unwrap();
        toast.success("Заявка отклонена", { position: "top-right" });
        setComment("");
        setShowReject(false);
        await refetch();
      } catch (err: any) {
        console.error("Reject error:", err);
        const errorMessage = err.data?.detail || "Ошибка при отклонении";
        toast.error(errorMessage, { position: "top-right" });
      }
    },
    [id, updateRequest, refetch]
  );

  if (isRequestLoading || isDriversLoading)
    return <div className="flex justify-center p-4">Загрузка...</div>;
  if (requestError || !request || driverIdError)
    return (
      <div className="text-red-500 p-4">
        {driverIdError
          ? "Ошибка загрузки данных водителя"
          : "Ошибка загрузки данных заявки"}
      </div>
    );

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
          {request.driver}
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
                        [route.id]: newValue as Option | null,
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
          disabled={
            isRequestLoading ||
            isDriversLoading ||
            isDriverIdLoading ||
            isUpdating ||
            request?.status === STATUS_MAP.approved
          }
          className="bg-green-500 hover:bg-green-600 py-4 px-6 text-white"
        >
          Одобрить
        </Button>
        <Button
          onClick={() => setShowReject(true)}
          disabled={
            isRequestLoading ||
            isDriversLoading ||
            isDriverIdLoading ||
            isUpdating
          }
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
