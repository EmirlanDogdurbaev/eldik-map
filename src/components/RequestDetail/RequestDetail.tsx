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

import CustomSelect from "../../ui/Select";
import RejectModal from "../../ui/RejectModal";
import {
  ArrowLeft,
  Calendar,
  User,
  MessageSquare,
  Car,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Target,
  Users,
  Route as RouteIcon,
  FileText,
} from "lucide-react";
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

const TOAST_CONFIG = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "light" as const,
};

const DRIVERS_QUERY_LIMIT = 100;

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

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center min-h-64">
    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <span className="ml-3 text-gray-600">Загрузка данных заявки...</span>
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
    <div className="flex items-center space-x-3">
      <XCircle className="w-6 h-6 text-red-500" />
      <div>
        <h3 className="text-lg font-semibold text-red-800">Ошибка загрузки</h3>
        <p className="text-red-600 mt-1">{message}</p>
      </div>
    </div>
  </div>
);

const getStatusBadge = (statusText: string) => {
  const statusMap: Record<string, { bg: string; text: string; icon: string }> =
    {
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
      created: {
        bg: "bg-yellow-100 text-yellow-800",
        text: "Создана",
        icon: "⏳",
      },
      approved: {
        bg: "bg-green-100 text-green-800",
        text: "Одобрена",
        icon: "✅",
      },
      rejected: {
        bg: "bg-red-100 text-red-800",
        text: "Отклонена",
        icon: "❌",
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

const RequestInfo: React.FC<{ request: Request }> = ({ request }) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Заявка #{request.id}
            </h1>
            <p className="text-gray-600">Детальная информация о заявке</p>
          </div>
        </div>
        {getStatusBadge(request.status_text)}
      </div>
    </div>

    {/* Info Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Дата создания</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(request.date).toLocaleDateString("ru-RU")}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Заявитель</p>
            <p className="text-lg font-bold text-gray-900">
              {request.user_name}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Водитель</p>
            <p className="text-lg font-bold text-gray-900">
              {request.driver_name || "Не назначен"}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Комментарии</p>
            <p className="text-lg font-bold text-gray-900">
              {request.comments ? "Есть" : "Нет"}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>

    {/* Comments Section */}
    {request.comments && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Комментарии
            </h3>
            <p className="text-gray-700 leading-relaxed">{request.comments}</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

const RouteTable: React.FC<{
  route: Route;
  drivers: Option[];
  selectedDriver: Option | null;
  onDriverChange: (driver: Option | null) => void;
}> = ({ route, drivers, selectedDriver, onDriverChange }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <RouteIcon className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Информация о маршруте
        </h3>
      </div>
    </div>

    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-600">Цель поездки</p>
              <p className="text-gray-900 font-medium">
                {route.goal || "Не указана"}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-600">Отправление</p>
              <p className="text-gray-900 font-medium">
                {route.departure || "Не указано"}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-600">Назначение</p>
              <p className="text-gray-900 font-medium">
                {route.destination || "Не указано"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-600">Время</p>
              <p className="text-gray-900 font-medium text-lg">{route.time}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Users className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-600">
                Количество пассажиров
              </p>
              <p className="text-gray-900 font-medium">
                {route.usage_count} человек
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 ">
            <div className="flex items-center space-x-3 mb-3">
              <Car className="w-5 h-5 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">
                Назначить водителя
              </p>
            </div>
            <CustomSelect
              options={drivers}
              value={selectedDriver}
              onChange={(value) => onDriverChange(value as Option | null)}
              placeholder="Выберите водителя"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [comment, setComment] = useState("");
  const [showReject, setShowReject] = useState(false);

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

  const {
    selectedDrivers,
    selectedDriverName,
    clearSelection,
    updateDriverForRoute,
    validationResult,
  } = useDriverSelection(request?.routes);

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
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasError || !request) {
    const errorMessage = driverIdError
      ? "Ошибка загрузки данных водителя"
      : "Ошибка загрузки данных заявки";
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage message={errorMessage} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
        <div className="flex items-center">
          <Link
            to="/dispatcher"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться к списку заявок</span>
          </Link>
        </div>

        <RequestInfo request={request} />

        <div className="space-y-6">
          {request.routes && request.routes.length > 0 ? (
            request.routes.map((route: Route) => (
              <RouteTable
                key={route.id}
                route={route}
                drivers={drivers}
                selectedDriver={selectedDrivers[route.id] || null}
                onDriverChange={(driver) =>
                  updateDriverForRoute(route.id, driver)
                }
              />
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Маршруты не найдены
              </h3>
              <p className="text-gray-600">
                Для данной заявки не найдено ни одного маршрута
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 ">
          <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleApprove}
              disabled={
                isActionDisabled || request.status === STATUS_MAP.approved
              }
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Одобрить заявку
            </button>

            <button
              onClick={() => setShowReject(true)}
              disabled={isActionDisabled}
              className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Отклонить заявку
            </button>
          </div>
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
        <ToastContainer {...TOAST_CONFIG} />
      </div>
    </div>
  );
};

export default RequestDetail;
