import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import type { TripFormData, TripRequest } from "../../types/tripSchema";
import { useCreateTripMutation } from "../../api/tripApi";
import LocationInputs from "../LocationInputs/LocationInputs";
import { Car, Truck, Bus, Plus } from "lucide-react";
import { useState } from "react";

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

  const onSubmit = async (data: TripFormData) => {
    try {
      const tripData: TripRequest = {
        date: data.date,
        user: localStorage.getItem("user_id") || "",
        goal: data.goal,
        departure: data.departure,
        destination: data.destination,
        time: data.time,
        vehicleType: selectedType,
      };

      await createTrip(tripData).unwrap();
      alert("Поездка создана!");
      reset();
      setDeparture(null);
      setDestination(null);
    } catch (err: any) {
      console.error("Ошибка создания поездки:", err);
      if (err.data) {
        alert(`Ошибка: ${JSON.stringify(err.data)}`);
      } else {
        alert("Произошла неизвестная ошибка при создании поездки.");
      }
    }
  };

  return (
    <div className={`${className} shadow min-w-96 max-h-[100dvh] bg-white overflow-y-auto`}>
      <aside className="p-4 sm:p-6 flex flex-col gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Дата поездки
            </label>
            <input
              type="date"
              id="date"
              className="mt-1 border border-gray-300 rounded-md w-full p-2"
              {...register("date")}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Время поездки
            </label>
            <input
              type="time"
              id="time"
              className="mt-1 border border-gray-300 rounded-md w-full p-2"
              {...register("time")}
            />
            {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>}
          </div>

          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
              Причина поездки
            </label>
            <Textarea
              placeholder="Укажите причину (например, В командировку)"
              className="mt-1 border border-gray-300 rounded-md w-full p-2"
              {...register("goal")}
            />
            {errors.goal && <p className="text-red-500 text-sm mt-1">{errors.goal.message}</p>}
          </div>

          
          {error && <p className="text-red-500 text-sm">Ошибка: {JSON.stringify(error)}</p>}


{/* Выбор транспорта */}
          <div className="bg-white shadow-xl rounded-2xl p-4 w-full text-center space-y-6">
          <h1 className="text-xl font-semibold text-gray-800">Выберите транспорт</h1>
          <div className="flex justify-between gap-2">
            {vehicleTypes.map((vehicle) => (
              <button
                key={vehicle.id}
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
            <button
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              onClick={() => alert("Маршрутная логика пока отключена")}
            >
              <Plus className="w-4 h-4" />
              Добавить маршрут
            </button>
          
            <Button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
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
