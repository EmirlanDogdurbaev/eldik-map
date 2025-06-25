import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useCreateTripMutation } from "../../api/tripApi";
import {
  Car,
  Truck,
  Bus,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Target,
  Trash2,
  Send,
} from "lucide-react";
import { z } from "zod";
import type { TripFormData } from "../../types/tripSchema";
import { useDraggableSidebar } from "../../utils/useDraggableSidebar";

import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import LocationInputs from "../LocationInputs/LocationInputs";
import Modal from "../../ui/Modal";

const vehicleTypes = [
  { id: "car", label: "Легковая", icon: <Car className="w-5 h-5" /> },
  { id: "truck", label: "Грузовая", icon: <Truck className="w-5 h-5" /> },
  { id: "bus", label: "Пассажирская", icon: <Bus className="w-5 h-5" /> },
];

interface SidebarProps {
  className?: string;
  departure?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  setDeparture: (coords: { lat: number; lng: number } | null) => void;
  setDestination: (coords: { lat: number; lng: number } | null) => void;
  selecting: "departure" | "destination" | null;
  setSelecting: (type: "departure" | "destination" | null) => void;
}

type RouteItem = {
  goal: string;
  departure: string;
  destination: string;
  time: string;
  date: string;
  vehicleType: string;
  user: string;
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const coordinateRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;

const tripSchema = z
  .object({
    date: z.string().min(1, "Укажите дату"),
    time: z.string().min(1, "Укажите время"),
    goal: z
      .string()
      .min(1, "Укажите причину")
      .max(500, "Причина слишком длинная"),

    // разрешаем адрес ИЛИ координаты
    departure: z
      .string()
      .refine((val) => val.length > 3 || coordinateRegex.test(val), {
        message: "Введите адрес или координаты отправления",
      }),
    destination: z
      .string()
      .refine((val) => val.length > 3 || coordinateRegex.test(val), {
        message: "Введите адрес или координаты назначения",
      }),
  })
  .refine(
    (data) => {
      const selectedDate = new Date(data.date);
      selectedDate.setHours(0, 0, 0, 0);
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

const Sidebar: React.FC<SidebarProps> = ({
  departure,
  destination,
  setDeparture,
  setDestination,
  selecting,
  setSelecting,
}) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  });

  const { sidebarRef, dragRef, toggleRef } = useDraggableSidebar(60); // 60 — высота шапки

  const [createTrip, { isLoading, error }] = useCreateTripMutation();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isTransportSelected, setIsTransportSelected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<React.ReactNode>("");
  const [modalTitle, setModalTitle] = useState("Оповещение");
  const [clearInputTrigger, setClearInputTrigger] = useState(0);

  const [routes, setRoutes] = useState<RouteItem[]>(() => {
    const stored = localStorage.getItem("routes");
    return stored ? JSON.parse(stored) : [];
  });

  const buildSingleRouteFromForm = (): RouteItem | null => {
    const values = getValues(); // from react-hook-form
    if (
      !values.date ||
      !values.time ||
      !values.goal ||
      !values.departure ||
      !values.destination ||
      !departure ||
      !destination
    ) {
      return null;
    }
    if (!selectedType) return null;
    return {
      goal: values.goal,
      departure: values.departure,
      destination: values.destination,
      time: values.time,
      date: values.date,
      vehicleType: selectedType ?? "",
      user: localStorage.getItem("user_id") || "",
    };
  };

  useEffect(() => {
    localStorage.setItem("routes", JSON.stringify(routes));
  }, [routes]);

  const handleAddRoute = handleSubmit((data) => {
    console.log("[FORM SUBMIT DATA]", data); // 👈 лог
    if (!departure || !destination) {
      alert("Укажите координаты отправления и назначения.");
      return;
    }

    if (routes.length >= 4) {
      alert("Максимум 4 маршрута.");
      return;
    }

    const newRoute: RouteItem = {
      goal: data.goal,
      departure: data.departure,
      destination: data.destination,
      time: data.time,
      date: data.date,
      vehicleType: selectedType ?? "",
      user: localStorage.getItem("user_id") || "",
    };

    setRoutes((prev) => [...prev, newRoute]);
    reset();
    setDeparture(null);
    setDestination(null);
    setSelectedType(null);
    setClearInputTrigger((prev) => prev + 1);
  });

  const coordsStore = JSON.parse(localStorage.getItem("route_coords") || "{}");
  coordsStore[routes.length] = {
    departure,
    destination,
  };
  localStorage.setItem("route_coords", JSON.stringify(coordsStore));

  const handleSendRoutes = async () => {
    let finalRoutes = [...routes];

    if (finalRoutes.length === 0) {
      const singleRoute = buildSingleRouteFromForm();
      if (!singleRoute) {
        alert("Заполните все поля или добавьте маршрут.");
        return;
      }
      finalRoutes = [singleRoute];
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("Не найден пользователь (user_id).");
      return;
    }

    const coordsStore = JSON.parse(
      localStorage.getItem("route_coords") || "{}"
    );

    const typeMap: Record<string, string> = {
      car: "light",
      truck: "cargo",
      bus: "passenger",
    };

    const payload = finalRoutes.map((route, index) => {
      const coords = coordsStore[index] || {};

      return {
        date: route.date,
        user: userId,
        routes: [
          {
            goal: route.goal,
            departure: route.departure,
            destination: route.destination,
            time: route.time,
            transport_type: typeMap[route.vehicleType],
            departure_coordinates: coords.departure
              ? [
                  coords.departure.lat.toString(),
                  coords.departure.lng.toString(),
                ]
              : [],
            destination_coordinates: coords.destination
              ? [
                  coords.destination.lat.toString(),
                  coords.destination.lng.toString(),
                ]
              : [],
          },
        ],
      };
    });

    // Показать модалку загрузки
    setModalTitle("Отправка...");
    setModalMessage("Подождите, происходит отправка маршрутов.");
    setModalLoading(true);
    setModalOpen(true);

    try {
      await createTrip(payload).unwrap();

      setModalTitle("Успешно!");
      setModalMessage("Поездки успешно отправлены.");
      setModalLoading(false);

      setRoutes([]);
      localStorage.removeItem("routes");
      localStorage.removeItem("route_coords");
      reset();
      setDeparture(null);
      setDestination(null);

      setSelectedType(null);
      setIsTransportSelected(false);
      setClearInputTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Ошибка отправки:", err);
      setModalTitle("Ошибка");
      setModalMessage("Не удалось отправить маршруты. Повторите попытку.");
      setModalLoading(false);
    }
  };

  const handleSendButton = async () => {
    if (routes.length > 0) {
      await handleSendRoutes();
    } else {
      handleSubmit(async () => {
        await handleSendRoutes();
      })();
    }
  };

  const handleRemoveRoute = (indexToRemove: number) => {
    const updatedRoutes = routes.filter((_, index) => index !== indexToRemove);
    setRoutes(updatedRoutes);
    localStorage.setItem("routes", JSON.stringify(updatedRoutes));
  };

  const handleSelectRoute = (index: number) => {
    const coordsStore = JSON.parse(
      localStorage.getItem("route_coords") || "{}"
    );
    const coords = coordsStore[index];
    if (!coords) return;

    setDeparture(coords.departure);
    setDestination(coords.destination);
  };

  const canSend =
    isTransportSelected &&
    (routes.length > 0 ||
      (getValues("date") &&
        getValues("time") &&
        getValues("goal") &&
        getValues("departure") &&
        getValues("destination") &&
        departure &&
        destination));

  const getVehicleLabel = (vehicleId: string) => {
    return vehicleTypes.find((v) => v.id === vehicleId)?.label || vehicleId;
  };

  const asideClass = `
  fixed bottom-0 left-0 right-0 top-[96px] bg-gradient-to-b from-gray-50 to-white border-t overflow-auto rounded-t-3xl shadow-2xl
  transition-transform duration-300 will-change-transform z-[500]
  sm:static sm:translate-y-0 sm:w-95 sm:h-auto sm:border-t-0 sm:border-r sm:rounded-none sm:shadow-lg sm:z-10 sm:bg-white
`;

  return (
    <>
      <aside
        ref={sidebarRef}
        className={asideClass + " p-4 sm:p-6 flex flex-col gap-6"}
      >
        {/* Мобильная шапка с улучшенным дизайном */}
        <div className="relative sm:hidden flex justify-center items-center mt-2 mb-6">
          <div
            ref={dragRef}
            className="w-12 h-1.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full cursor-grab active:cursor-grabbing touch-none transition-all hover:from-gray-400 hover:to-gray-500"
          ></div>
          <button
            ref={toggleRef}
            onClick={() => console.log("Тоггл сайдбара")}
            className="absolute right-4 p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50"
            aria-label="Toggle sidebar"
          >
            <div className="w-5 h-5 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-gray-600 rounded"></div>
              <div className="w-full h-0.5 bg-gray-600 rounded"></div>
              <div className="w-full h-0.5 bg-gray-600 rounded"></div>
            </div>
          </button>
        </div>

        <form
          className="flex flex-col gap-6"
          onSubmit={handleSubmit(() => handleSendRoutes())}
        >
          {/* Заголовок с иконкой */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="p-2 bg-blue-50 rounded-xl">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-800">
              Планирование маршрута
            </h4>
          </div>

          {/* Компонент выбора координат */}
          <LocationInputs
            departure={departure}
            destination={destination}
            setDeparture={setDeparture}
            setDestination={setDestination}
            selecting={selecting}
            setSelecting={setSelecting}
            errors={errors}
            setValue={setValue}
            clearTrigger={clearInputTrigger}
            control={control}
            onCloseSidebar={() => toggleRef.current?.click()}
          />

          {/* Дата и время в красивых карточках */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <label
                htmlFor="date"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                Дата поездки
              </label>
              <input
                type="date"
                id="date"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                {...register("date")}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <label
                htmlFor="time"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
              >
                <Clock className="w-4 h-4 text-green-500" />
                Время поездки
              </label>
              <input
                type="time"
                id="time"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                {...register("time")}
              />
              {errors.time && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>

          {/* Причина поездки */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <label
              htmlFor="goal"
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <Target className="w-4 h-4 text-purple-500" />
              Причина поездки
            </label>
            <Textarea
              placeholder="Укажите причину поездки (например, командировка, деловая встреча...)"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              rows={3}
              {...register("goal")}
            />
            {errors.goal && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.goal.message}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm font-medium">
                Произошла ошибка: {JSON.stringify(error)}
              </p>
            </div>
          )}

          {/* Выбор транспорта - улучшенный дизайн */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Выберите транспорт
              </h2>
              <p className="text-gray-500 text-sm">
                Выберите подходящий тип транспорта для поездки
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {vehicleTypes.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(vehicle.id);
                    setIsTransportSelected(true);
                  }}
                  className={`relative flex flex-col items-center py-4 px-3 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
                    selectedType === vehicle.id && isTransportSelected
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg scale-105"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl mb-2 ${
                      selectedType === vehicle.id && isTransportSelected
                        ? "bg-white/20"
                        : "bg-white"
                    }`}
                  >
                    {vehicle.icon}
                  </div>
                  <span className="text-xs font-semibold">{vehicle.label}</span>
                  {selectedType === vehicle.id && isTransportSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Кнопки действий */}
            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleAddRoute}
                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 flex items-center justify-center gap-2 font-semibold border border-gray-200"
              >
                <Plus className="w-5 h-5" />
                Добавить в список маршрутов
              </Button>

              {/* Список маршрутов с улучшенным дизайном */}
              {routes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 text-center">
                    Добавленные маршруты ({routes.length}/4)
                  </h3>
                  {routes.map((route, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectRoute(index)}
                      className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:from-blue-100 hover:to-indigo-100"
                    >
                      <button
                        type="button"
                        className="absolute top-3 right-3 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRoute(index);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="pr-10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <h4 className="font-semibold text-gray-800">
                            Маршрут {index + 1}
                          </h4>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{route.date}</span>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{route.time}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                  Откуда:
                                </span>
                                <p className="text-gray-700 break-words">
                                  {route.departure}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                  Куда:
                                </span>
                                <p className="text-gray-700 break-words">
                                  {route.destination}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                            <div className="flex items-center gap-2">
                              {
                                vehicleTypes.find(
                                  (v) => v.id === route.vehicleType
                                )?.icon
                              }
                              <span className="text-gray-600">
                                {getVehicleLabel(route.vehicleType)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-purple-500" />
                              <span className="text-gray-600 text-xs">
                                {route.goal.length > 20
                                  ? route.goal.substring(0, 20) + "..."
                                  : route.goal}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Главная кнопка отправки */}
              <Button
                type="button"
                onClick={handleSendButton}
                disabled={isLoading || !canSend}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3 ${
                  canSend && !isLoading
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Отправиться в путь
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </aside>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        confirmText="Закрыть"
        isLoading={modalLoading}
      />
    </>
  );
};

export default Sidebar;
