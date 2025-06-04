import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import type { TripFormData, TripRequest } from "../../types/tripSchema";
import { useCreateTripMutation } from "../../api/tripApi";
import LocationInputs from "../LocationInputs/LocationInputs";
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

  const onSubmit = async (data: TripFormData) => {
    try {
      const tripData: TripRequest = {
        date: data.date,
        user: localStorage.getItem("user_id") || "",
        routes: [
          {
            goal: data.goal,
            departure: data.departure,
            destination: data.destination,
            time: data.time,
          },
        ],
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
    <div className={`${className} shadow min-w-96 max-h-[100dvh] bg-white`}>
      <aside className="p-4 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold">Выберите Координаты</h4>
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

          <Button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Отправка..." : "Отправить"}
          </Button>
          {error && (
            <p className="text-red-500 text-sm">
              Ошибка: {JSON.stringify(error)}
            </p>
          )}
        </form>
      </aside>
    </div>
  );
};

export default Sidebar;
