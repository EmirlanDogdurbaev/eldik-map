import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateTripMutation,
  useGetHistoryRoutesQuery,
  useUpdateRouteTimeMutation,
} from "../../api/tripApi";
import Pagination from "../../ui/Pagination";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import { RefreshCw, Play } from "lucide-react";
import { extractCleanRoute } from "../../utils/routeUtils";
import type { RouteItem } from "../../types/tripSchema";

const resendTripSchema = z
  .object({
    date: z.string().min(1, "Укажите дату"),
    time: z.string().min(1, "Укажите время"),
    goal: z
      .string()
      .min(1, "Укажите причину")
      .max(500, "Причина слишком длинная"),
  })
  .refine(
    (data) => {
      const selectedDate = new Date(data.date);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    {
      path: ["date"],
      message: "Дата не может быть в прошлом",
    }
  )
  .refine(
    (data) => {
      const selectedDate = new Date(data.date);
      const now = new Date();
      const [hours, minutes] = data.time.split(":").map(Number);
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(hours, minutes, 0, 0);
      if (selectedDate.toDateString() === now.toDateString()) {
        return selectedDateTime > now;
      }
      return true;
    },
    {
      path: ["time"],
      message: "Время должно быть в настоящем или в будущем",
    }
  );

const odometerSchema = z.object({
  odometer: z
    .number()
    .min(0, "Значение одометра не может быть отрицательным")
    .int("Значение одометра должно быть целым числом"),
});

type ResendTripFormData = z.infer<typeof resendTripSchema>;
type OdometerFormData = z.infer<typeof odometerSchema>;

const HistoryRoutesPage: React.FC = () => {
  const role = localStorage.getItem("role") ?? "user";
  const user_id = localStorage.getItem("user_id") ?? "";
  const [limit] = useState(5);
  const [offset, setOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [odometerModalOpen, setOdometerModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState("Оповещение");
  const [modalMessage, setModalMessage] = useState<React.ReactNode>("");
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"start" | "end" | null>(null);
  const [isTripStarted, setIsTripStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const { data, isError, isFetching } = useGetHistoryRoutesQuery({
    user_id,
    limit,
    offset,
    completed,
  });

  const [createTrip] = useCreateTripMutation();
  const [updateRouteTime] = useUpdateRouteTimeMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResendTripFormData>({
    resolver: zodResolver(resendTripSchema),
  });

  const {
    register: registerOdometer,
    handleSubmit: handleOdometerSubmit,
    formState: { errors: odometerErrors },
    reset: resetOdometer,
  } = useForm<OdometerFormData>({
    resolver: zodResolver(odometerSchema),
  });

  const getGoalColor = (goal: string) => {
    const colors: { [key: string]: string } = {
      Работа: "bg-blue-100 text-blue-800 border border-blue-200",
      Встреча: "bg-green-100 text-green-800 border border-green-200",
      Досуг: "bg-purple-100 text-purple-800 border border-purple-200",
      Покупки: "bg-orange-100 text-orange-800 border border-orange-200",
      Учеба: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    };
    return colors[goal] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalLoading(false);
    setModalTitle("Оповещение");
    setModalMessage("");
    setSelectedRoute(null);
    setRequestId(null);
    setIsTripStarted(false);
    reset();
  };

  const closeOdometerModal = () => {
    setOdometerModalOpen(false);
    resetOdometer();
  };

  const handleResendRoute = (route: RouteItem) => {
    setSelectedRoute(JSON.parse(JSON.stringify(route)));
    setModalOpen(true);
    reset({ date: "", time: "", goal: route.goal });
  };

  const handleStartRoute = (route: RouteItem, request_id: string) => {
    setSelectedRoute(JSON.parse(JSON.stringify(route)));
    setRequestId(request_id);
    setModalOpen(true);
  };

  const handleStartTrip = () => {
    setActionType("start");
    setOdometerModalOpen(true);
  };

  const handleEndTrip = () => {
    setActionType("end");
    setOdometerModalOpen(true);
  };

  const onSubmit = async (formData: ResendTripFormData) => {
    if (!selectedRoute) return;

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      setModalTitle("Ошибка");
      setModalMessage("Не найден пользователь (user_id).");
      setModalLoading(false);
      return;
    }

    const cleanedRoute = extractCleanRoute(selectedRoute, {
      goal: formData.goal,
      time: formData.time,
    });

    const payload = [
      {
        date: formData.date,
        user: userId,
        routes: [cleanedRoute],
      },
    ];

    setModalTitle("Отправка...");
    setModalMessage("Подождите, происходит отправка маршрута.");
    setModalLoading(true);

    try {
      await createTrip(payload).unwrap();
      setModalTitle("Успешно!");
      setModalMessage("Поездка успешно отправлена.");
      setModalLoading(false);
    } catch (err) {
      console.error("Ошибка при отправке маршрута:", err);
      setModalTitle("Ошибка");
      setModalMessage("Не удалось отправить маршрут. Повторите попытку.");
      setModalLoading(false);
    }
  };

  const onOdometerSubmit = async (formData: OdometerFormData) => {
    if (!selectedRoute || !requestId || !actionType) return;

    const payload = {
      action: actionType,
      time: new Date().toISOString(),
      odometer: formData.odometer,
    };

    setModalLoading(true);
    setOdometerModalOpen(false);

    try {
      await updateRouteTime({
        requestId,
        routeId: selectedRoute.id!,
        data: payload,
      }).unwrap();
      if (actionType === "start") {
        setIsTripStarted(true);
        setModalTitle("Поездка начата");
        setModalMessage(
          "Вы успешно начали поездку. Нажмите 'Закончить' для завершения."
        );
      } else {
        closeModal();
      }
      setModalLoading(false);
      resetOdometer();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Ошибка при обновлении времени маршрута:", err);
      setModalLoading(false);
      if (err?.data?.error === "Start time already set.") {
        setModalTitle("Ошибка");
        setModalMessage("Время начала поездки уже установлено.");
        setIsTripStarted(true); // Предполагаем, что поездка уже начата
      } else {
        setModalTitle("Ошибка");
        setModalMessage(
          "Не удалось обновить данные маршрута. Повторите попытку."
        );
      }
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col items-center justify-center min-h-[500px]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-base font-semibold text-gray-700">
            Загрузка маршрутов...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data || !data.results.routes) {
    return (
      <div className=" min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center min-h-[500px] flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4 shadow-sm">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Ошибка загрузки
          </h3>
          <p className="text-base text-gray-600">
            Не удалось загрузить маршруты. Попробуйте позже.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen  bg-gradient-to-br from-blue-50 to-white ">
      <div className="max-w-screen mx-auto px-6 py-8 font-inter">
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              История маршрутов
            </h2>
            <p className="text-base font-medium text-gray-600">
              Ваши последние поездки
            </p>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-semibold border ${
              !completed
                ? "bg-blue-500 text-white"
                : "bg-white text-blue-700 border-blue-300"
            }`}
            onClick={() => setCompleted(false)}
          >
            В процессе
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold border ${
              completed
                ? "bg-green-500 text-white"
                : "bg-white text-green-700 border-green-300"
            }`}
            onClick={() => setCompleted(true)}
          >
            Выполненные
          </button>
        </div>

        {data.results.routes.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6 shadow-sm">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Нет маршрутов
              </h3>
              <p className="text-base font-medium text-gray-600">
                У вас пока нет сохраненных маршрутов.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {data.results.routes.map((route, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 relative group hover:border-blue-200"
              >
                {role === "user" && !completed && (
                  <button
                    onClick={() => handleResendRoute(route)}
                    className="absolute top-4 right-4 p-3 text-gray-500 hover:text-blue-600 transition-all duration-200 bg-gray-50 hover:bg-blue-50 rounded-xl shadow-sm hover:shadow-md"
                    title="Повторить путь"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
                {role === "driver" && !completed && (
                  <button
                    onClick={() => handleStartRoute(route, route.request_id!)}
                    className="absolute top-4 right-4 p-3 text-gray-500 hover:text-green-600 transition-all duration-200 bg-gray-50 hover:bg-green-50 rounded-xl shadow-sm hover:shadow-md"
                    title="Начать путь"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <span className="block text-sm font-bold text-blue-800 mb-1">
                      Дата поездки
                    </span>
                    <span className="text-base font-semibold text-gray-800">
                      {route.travel_date}
                    </span>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <span className="block text-sm font-bold text-green-800 mb-1">
                      Время
                    </span>
                    <span className="text-base font-semibold text-gray-800">
                      {route.time}
                    </span>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <span className="block text-sm font-bold text-purple-800 mb-1">
                      Транспорт
                    </span>
                    <span className="text-base font-semibold text-gray-800">
                      {route.transport_type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-sm font-bold text-green-700 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Откуда
                    </p>
                    <p className="text-base font-semibold text-gray-900 break-words">
                      {route.departure}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-sm font-bold text-red-700 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Куда
                    </p>
                    <p className="text-base font-semibold text-gray-900 break-words">
                      {route.destination}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${getGoalColor(
                      route.goal
                    )}`}
                  >
                    Цель поездки: {route.goal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalOpen && (
          <Modal
            isOpen={modalOpen}
            onClose={closeModal}
            title={modalTitle}
            onConfirm={function (): void {
              throw new Error("Function not implemented.");
            }}
            message={undefined}
          >
            {modalLoading ? (
              <div className="bg-white rounded-xl p-6">
                <p className="text-base font-medium text-gray-700 mb-4">
                  Подождите, выполняется действие...
                </p>
              </div>
            ) : modalMessage ? (
              <div className="bg-white rounded-xl p-6">
                <p className="text-base font-medium text-gray-700 mb-4">
                  {modalMessage}
                </p>
                {role === "driver" ? (
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleStartTrip}
                      disabled={isTripStarted}
                      className="px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Начать путь
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleEndTrip}
                      disabled={!isTripStarted}
                      className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Закончить
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end mt-6">
                    <Button
                      type="button"
                      className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl"
                      onClick={closeModal}
                    >
                      Закрыть
                    </Button>
                  </div>
                )}
              </div>
            ) : role === "user" ? (
              <div className="bg-white rounded-xl p-6">
                <div onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Дата поездки
                    </label>
                    <input
                      type="date"
                      {...register("date")}
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-0 text-base font-medium px-4 py-3 transition-colors"
                    />
                    {errors.date && (
                      <p className="mt-2 text-sm font-medium text-red-600">
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Время
                    </label>
                    <input
                      type="time"
                      {...register("time")}
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-0 text-base font-medium px-4 py-3 transition-colors"
                    />
                    {errors.time && (
                      <p className="mt-2 text-sm font-medium text-red-600">
                        {errors.time.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Цель поездки
                    </label>
                    <Textarea
                      {...register("goal")}
                      className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-0 text-base font-medium px-4 py-3 transition-colors min-h-[100px]"
                    />
                    {errors.goal && (
                      <p className="mt-2 text-sm font-medium text-red-600">
                        {errors.goal.message}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setModalOpen(false);
                        reset();
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors shadow-lg hover:shadow-xl"
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl"
                      onClick={handleSubmit(onSubmit)}
                    >
                      Отправиться в путь!
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6">
                <div className="space-y-6">
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleStartTrip}
                      disabled={isTripStarted}
                      className="px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Начать путь
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleEndTrip}
                      disabled={!isTripStarted}
                      className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Закончить
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Modal>
        )}

        {odometerModalOpen && (
          <Modal
            isOpen={odometerModalOpen}
            onClose={closeOdometerModal}
            title="Ввод показаний одометра"
            onConfirm={function (): void {
              throw new Error("Function not implemented.");
            }}
            message={undefined}
          >
            <div className="bg-white rounded-xl p-6">
              <div
                onSubmit={handleOdometerSubmit(onOdometerSubmit)}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Показания одометра
                  </label>
                  <input
                    type="number"
                    {...registerOdometer("odometer", { valueAsNumber: true })}
                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-0 text-base font-medium px-4 py-3 transition-colors"
                    placeholder="Введите значение одометра"
                  />
                  {odometerErrors.odometer && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {odometerErrors.odometer.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeOdometerModal}
                    className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl"
                    onClick={handleOdometerSubmit(onOdometerSubmit)}
                  >
                    Подтвердить
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {data.results.routes.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100">
              <Pagination
                limit={limit}
                offset={offset}
                count={data.count}
                onOffsetChange={setOffset}
                onLimitChange={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryRoutesPage;
