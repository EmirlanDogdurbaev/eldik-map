import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import type { TripFormData } from "../../types/tripSchema";
import { useCreateTripMutation } from "../../api/tripApi";
import LocationInputs from "../LocationInputs/LocationInputs";
import { Car, Truck, Bus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

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

const tripSchema = z.object({
  date: z.string().min(1, "Укажите дату"),
  time: z.string().min(1, "Укажите время"),
  goal: z
    .string()
    .min(1, "Укажите причину")
    .max(500, "Причина слишком длинная"),
  departure: z.string().min(1, "Укажите точку отправления"),
  destination: z.string().min(1, "Укажите точку назначения"),
});

const Sidebar: React.FC<SidebarProps> = ({
  className,
  departure,
  destination,
  setDeparture,
  setDestination,
  selecting,
  setSelecting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  });

  const [createTrip, { isLoading, error }] = useCreateTripMutation();
  const [selectedType, setSelectedType] = useState<string>("car");
  const [routes, setRoutes] = useState<RouteItem[]>(() => {
    const stored = localStorage.getItem("routes");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("routes", JSON.stringify(routes));
  }, [routes]);

  const handleAddRoute = handleSubmit((data) => {
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
      vehicleType: selectedType,
      user: localStorage.getItem("user_id") || "",
    };

    setRoutes((prev) => [...prev, newRoute]);
    reset();
    setDeparture(null);
    setDestination(null);
  });

  const handleSendRoutes = async () => {
    if (routes.length === 0) {
      alert("Добавьте хотя бы один маршрут.");
      return;
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("Не найден пользователь (user_id).");
      return;
    }

    const tripDate = routes[0]?.date; // предполагаем, что у всех маршрутов одинаковая дата
    const cleanRoutes = routes.map(({ date, user, ...rest }) => rest); // удаляем лишнее

    try {
      await createTrip({
        date: tripDate,
        user: userId,
        routes: cleanRoutes,
      }).unwrap();

      alert("Поездка успешно отправлена!");
      setRoutes([]);
      localStorage.removeItem("routes");
      reset();
      setDeparture(null);
      setDestination(null);
    } catch (err: any) {
      console.error("Ошибка отправки:", err);
      alert("Ошибка при отправке маршрутов.");
    }
  };

  const handleRemoveRoute = (indexToRemove: number) => {
    const updatedRoutes = routes.filter((_, index) => index !== indexToRemove);
    setRoutes(updatedRoutes);
    localStorage.setItem("routes", JSON.stringify(updatedRoutes));
  };

  return (
    <div
      className={`${className} shadow min-w-96 max-h-[100dvh] bg-white overflow-y-auto`}
    >
      <aside className="p-4 sm:p-6 flex flex-col gap-6">
        <form className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold">Выберите координаты</h4>

          <LocationInputs
            departure={departure}
            destination={destination}
            setDeparture={setDeparture}
            setDestination={setDestination}
            selecting={selecting}
            setSelecting={setSelecting}
            register={register}
            errors={errors}
            setValue={setValue}
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
                  onClick={() => setSelectedType(vehicle.id)}
                  className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg border ${
                    selectedType === vehicle.id
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
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Добавить маршрут
              </Button>

              {routes.map((route, index) => (
                <div
                  key={index}
                  className="w-full max-w-[420px] p-3 border rounded bg-gray-50 text-sm space-y-1 text-left relative overflow-hidden"
                >
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs"
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
                onClick={handleSendRoutes}
                disabled={isLoading || routes.length === 0}
                className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? "Отправка..." : "Отправиться в путь"}
              </Button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
};

export default Sidebar;
