import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useCreateTripMutation } from "../../api/tripApi";
import { Car, Truck, Bus, Plus } from "lucide-react";
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

  const asideClass = `
  fixed bottom-0 left-0 right-0 w-full h-screen bg-blue-100 border-t overflow-auto rounded-t-2xl shadow-lg
  transition-transform duration-200 will-change-transform z-[500]
  sm:static sm:translate-y-0 sm:w-95 sm:h-auto sm:border-t-0 sm:border-r sm:rounded-none sm:shadow-none sm:z-10
`;

  return (
    <>
      <aside
        ref={sidebarRef}
        className={asideClass + " p-4 sm:p-6 flex flex-col gap-6"}
      >
        <div className="relative sm:hidden flex justify-center items-center mt-2 mb-4">
          <div
            ref={dragRef}
            className="w-32 h-2 bg-gray-500 rounded-full cursor-grab active:cursor-grabbing touch-none"
          ></div>
          <button
            ref={toggleRef}
            className="absolute right-4 p-1 bg-gray-200 rounded-full"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(() => handleSendRoutes())}
        >
          <h4 className="text-lg font-semibold">Выберите координаты</h4>

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
          />

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              Дата поездки
            </label>
            <input
              type="date"
              id="date"
              className="mt-1 border border-gray-300 rounded-md w-full p-2"
              {...register("date")}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="time"
              className="block text-sm font-medium text-gray-700"
            >
              Время поездки
            </label>
            <input
              type="time"
              id="time"
              className="mt-1 border border-gray-300 rounded-md w-full p-2"
              {...register("time")}
            />
            {errors.time && (
              <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="goal"
              className="block text-sm font-medium text-gray-700"
            >
              Причина поездки
            </label>
            <Textarea
              placeholder="Укажите причину (например, В командировку)"
              className="mt-1 border border-gray-300 rounded-md w-full p-2"
              {...register("goal")}
            />
            {errors.goal && (
              <p className="text-red-500 text-sm mt-1">{errors.goal.message}</p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm">
              Ошибка: {JSON.stringify(error)}
            </p>
          )}

          {/* Выбор транспорта */}
          <div className="bg-white shadow-xl rounded-2xl p-4 w-full text-center space-y-6">
            <h1 className="text-xl font-semibold text-gray-800">
              Выберите транспорт
            </h1>
            <div className="flex justify-between gap-2">
              {vehicleTypes.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(vehicle.id);
                    setIsTransportSelected(true);
                  }}
                  className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg border cursor-pointer ${
                    selectedType === vehicle.id && isTransportSelected
                      ? "bg-black text-white border-black"
                      : "bg-gray-100 text-gray-800 border-gray-300"
                  } transition-all`}
                >
                  {vehicle.icon}
                  <span className="text-sm mt-1">{vehicle.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 items-center">
              <Button
                type="button"
                onClick={handleAddRoute}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Добавить маршрут
              </Button>

              {routes.map((route, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectRoute(index)}
                  className="w-full max-w-[420px] p-3 border rounded bg-gray-50 text-sm space-y-1 text-left relative overflow-hidden cursor-pointer"
                >
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs cursor-pointer"
                    onClick={() => handleRemoveRoute(index)}
                  >
                    Удалить
                  </button>
                  <p className="font-semibold">Маршрут {index + 1}</p>
                  <p className="break-words">
                    🗓️ {route.date}, 🕒 {route.time}
                  </p>
                  <p className="break-words">
                    📍 <strong>Откуда:</strong> {route.departure}
                  </p>
                  <p className="break-words">
                    📍 <strong>Куда:</strong> {route.destination}
                  </p>
                  <p className="break-words">🚘 {route.vehicleType}</p>
                  <p className="break-words">🎯 {route.goal}</p>
                </div>
              ))}

              <Button
                type="button"
                onClick={handleSendButton}
                disabled={isLoading || !canSend}
                className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? "Отправка..." : "Отправиться в путь"}
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
