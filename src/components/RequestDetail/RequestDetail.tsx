import { useState, useCallback, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useGetRequestByIdQuery,
  useGetDriversQuery,
  useGetDriverByNameAndRoleQuery,
  useUpdateRequestMutation,
  type Route,
  type Request,
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
} as const;

// Constants for better maintainability
const TOAST_CONFIG = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "dark" as const,
};

const DRIVERS_QUERY_LIMIT = 100;

// Custom hooks for better separation of concerns
const useDriverSelection = (routes?: Route[]) => {
  const [selectedDrivers, setSelectedDrivers] = useState<
    Record<string, Option | null>
  >({});

  const selectedDriverName = useMemo(
    () => Object.values(selectedDrivers)[0]?.label,
    [selectedDrivers]
  );

  const clearSelection = useCallback(() => {
    setSelectedDrivers({});
  }, []);

  const updateDriverForRoute = useCallback(
    (routeId: string, driver: Option | null) => {
      setSelectedDrivers((prev) => ({
        ...prev,
        [routeId]: driver,
      }));
    },
    []
  );

  // Validation logic
  const validationResult = useMemo(() => {
    const driverNames = Object.values(selectedDrivers)
      .filter((driver): driver is Option => driver !== null)
      .map((driver) => driver.label);

    if (driverNames.length === 0) {
      return { isValid: false, error: "Выберите водителя для маршрута" };
    }

    const uniqueDriverNames = new Set(driverNames);
    if (uniqueDriverNames.size > 1) {
      return {
        isValid: false,
        error: "Для всех маршрутов должен быть выбран один водитель",
      };
    }

    const allRoutesHaveDrivers =
      routes?.every((route) => selectedDrivers[route.id]) ?? false;
    if (!allRoutesHaveDrivers && routes && routes.length > 0) {
      return {
        isValid: false,
        error: "Выберите водителя для каждого маршрута",
      };
    }

    return { isValid: true, error: null };
  }, [selectedDrivers, routes]);

  return {
    selectedDrivers,
    selectedDriverName,
    clearSelection,
    updateDriverForRoute,
    validationResult,
  };
};

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center p-4">Загрузка...</div>
);

// Error component
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-red-500 p-4">{message}</div>
);

// Request info component
const RequestInfo: React.FC<{ request: Request }> = ({ request }) => (
  <div className="bg-white p-4 rounded-lg shadow-md mb-4">
    <p>
      <strong>Дата:</strong> {new Date(request.date).toLocaleDateString()}
    </p>
    <p>
      <strong>Пользователь:</strong> {request.user_name}
    </p>
    <p>
      <strong>Статус:</strong> {request.status_text}
    </p>
    <p>
      <strong>Комментарии:</strong> {request.comments || "Нет комментариев"}
    </p>
    <p>
      <strong>Водитель:</strong> {request.driver_name || "Не назначен"}
    </p>
  </div>
);

// Route table component
const RouteTable: React.FC<{
  route: Route;
  drivers: Option[];
  selectedDriver: Option | null;
  onDriverChange: (driver: Option | null) => void;
}> = ({ route, drivers, selectedDriver, onDriverChange }) => (
  <div className="mb-4">
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
              value={selectedDriver}
              onChange={(value) => onDriverChange(value as Option | null)}
              placeholder="Выберите водителя"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [comment, setComment] = useState("");
  const [showReject, setShowReject] = useState(false);

  // API queries
  const {
    data: request,
    isLoading: isRequestLoading,
    error: requestError,
    refetch,
  } = useGetRequestByIdQuery(id || "");

  const [updateRequest, { isLoading: isUpdating }] = useUpdateRequestMutation();

  const { data: driversData, isLoading: isDriversLoading } = useGetDriversQuery(
    {
      limit: DRIVERS_QUERY_LIMIT,
    }
  );

  // Custom hook for driver selection
  const {
    selectedDrivers,
    selectedDriverName,
    clearSelection,
    updateDriverForRoute,
    validationResult,
  } = useDriverSelection(request?.routes);

  // Driver options
  const drivers = useMemo(
    (): Option[] =>
      (driversData?.results || []).map((d) => ({
        value: d.user,
        label: d.user,
      })),
    [driversData]
  );

  // Get driver ID query
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

  // Debug logging (consider removing in production)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Загрузка данных заявки:", driversData);
      console.log("Список водителей:", drivers);
      console.log("Выбранные водители:", selectedDrivers);
      console.log("Данные водителя из /users/:", driverData);
      console.log("ID водителя:", driverId);
    }
  }, [driversData, drivers, selectedDrivers, driverData, driverId]);

  // Handler functions
  const handleApprove = useCallback(async () => {
    if (request?.status === STATUS_MAP.approved) {
      toast.info("Заявка уже одобрена", TOAST_CONFIG);
      return;
    }

    if (!validationResult.isValid) {
      toast.error(validationResult.error!, TOAST_CONFIG);
      return;
    }

    if (!driverId) {
      toast.error("ID водителя не найден в базе данных", TOAST_CONFIG);
      console.error("Ошибка: driverId не определен");
      return;
    }

    try {
      const updateData = {
        id: id || "",
        status: STATUS_MAP.approved,
        driver: driverId,
      };

      if (process.env.NODE_ENV === "development") {
        console.log("Отправляем запрос updateRequest:", updateData);
      }

      await updateRequest(updateData).unwrap();
      toast.success("Заявка одобрена", TOAST_CONFIG);
      clearSelection();
      await refetch();
    } catch (err: any) {
      console.error("Ошибка при одобрении:", err);
      const errorMessage =
        err.data?.driver?.[0] || err.data?.detail || "Ошибка при подтверждении";
      toast.error(errorMessage, TOAST_CONFIG);
    }
  }, [
    request?.status,
    validationResult,
    driverId,
    id,
    updateRequest,
    clearSelection,
    refetch,
  ]);

  const handleReject = useCallback(
    async (reason: string) => {
      try {
        const updateData = {
          id: id || "",
          status: STATUS_MAP.rejected,
          comments: reason,
        };

        if (process.env.NODE_ENV === "development") {
          console.log("Отправляем запрос на отклонение:", updateData);
        }

        await updateRequest(updateData).unwrap();
        toast.success("Заявка отклонена", TOAST_CONFIG);
        setComment("");
        setShowReject(false);
        await refetch();
      } catch (err: any) {
        console.error("Reject error:", err);
        const errorMessage = err.data?.detail || "Ошибка при отклонении";
        toast.error(errorMessage, TOAST_CONFIG);
      }
    },
    [id, updateRequest, refetch]
  );

  // Loading states
  const isLoading = isRequestLoading || isDriversLoading;
  const hasError = requestError || driverIdError;
  const isActionDisabled = isLoading || isDriverIdLoading || isUpdating;

  // Render loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Render error state
  if (hasError || !request) {
    const errorMessage = driverIdError
      ? "Ошибка загрузки данных водителя"
      : "Ошибка загрузки данных заявки";
    return <ErrorMessage message={errorMessage} />;
  }

  return (
    <div className="p-6 min-w-7xl mx-auto">
      {/* Back navigation */}
      <div>
        <Link
          to="/dispatcher"
          className="text-blue-500 hover:underline mb-4 inline-flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Вернуться назад
        </Link>
      </div>

      {/* Page title */}
      <h2 className="text-2xl font-bold mb-6">Детали заявки #{request.id}</h2>

      {/* Request information */}
      <RequestInfo request={request} />

      {/* Routes */}
      {request.routes &&
        request.routes.length > 0 &&
        request.routes.map((route: Route) => (
          <RouteTable
            key={route.id}
            route={route}
            drivers={drivers}
            selectedDriver={selectedDrivers[route.id] || null}
            onDriverChange={(driver) => updateDriverForRoute(route.id, driver)}
          />
        ))}

      {/* Show message if no routes */}
      {(!request.routes || request.routes.length === 0) && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-gray-600">Маршруты не найдены для данной заявки</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 space-x-2 flex justify-end">
        <Button
          onClick={handleApprove}
          disabled={isActionDisabled || request.status === STATUS_MAP.approved}
          className="bg-green-500 hover:bg-green-600 py-4 px-6 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Одобрить
        </Button>
        <Button
          onClick={() => setShowReject(true)}
          disabled={isActionDisabled}
          className="bg-red-500 hover:bg-red-600 py-4 px-6 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Отклонить
        </Button>
      </div>

      {/* Reject modal */}
      {showReject && (
        <RejectModal
          comment={comment}
          onChange={setComment}
          onConfirm={handleReject}
          onCancel={() => setShowReject(false)}
          isLoading={isUpdating}
        />
      )}

      <ToastContainer {...TOAST_CONFIG} />
    </div>
  );
};

export default RequestDetail;
