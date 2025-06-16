import {
  useGetCarsQuery,
  useUpdateDriverCarMutation,
  type CarsResponse,
} from "../../api/carsApi";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  useGetDriversQuery,
  type PaginatedDrivers,
} from "../../api/requestsApi";
import Modal from "../../ui/Modal";

const Cars = () => {
  const {
    data: driversData,
    isLoading: isDriversLoading,
    refetch: refetchDrivers,
  } = useGetDriversQuery({ limit: 10 });
  const { data: carsData, isLoading: isCarsLoading } = useGetCarsQuery(
    { limit: 10, offset: 0 },
    { skip: !driversData }
  );
  const [updateDriverCar, { isLoading: isUpdating }] =
    useUpdateDriverCarMutation();
  const [selectedCars, setSelectedCars] = useState<Record<string, string>>({});
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    driverId: string | null;
    driverName: string | null;
    carId: string | null;
    carName: string | null;
  }>({
    isOpen: false,
    driverId: null,
    driverName: null,
    carId: null,
    carName: null,
  });

  const handleCarChange = (driverId: string, carId: string) => {
    const selectedCar = carsData?.results.find(
      (car: CarsResponse["results"][0]) => car.id === carId
    );
    const selectedDriver = driversData?.results.find(
      (driver: PaginatedDrivers["results"][0]) => driver.id === driverId
    );
    console.log(
      "Выбран водитель:",
      selectedDriver?.user,
      "ID:",
      driverId,
      "Машина:",
      selectedCar?.name
    );
    if (!selectedDriver) {
      toast.error("Водитель не найден");
      return;
    }
    setModalState({
      isOpen: true,
      driverId: driverId,
      driverName: selectedDriver?.user || "",
      carId: selectedCar?.id || null,
      carName: selectedCar?.name || "",
    });
  };

  const handleConfirm = async () => {
    if (modalState.driverId && modalState.driverName && modalState.carId) {
      try {
        console.log("Подтверждение назначения:", {
          driverId: modalState.driverId,
          driverName: modalState.driverName,
          carId: modalState.carId,
        });
        await updateDriverCar({
          driverId: modalState.driverId,
          driverName: modalState.driverName,
          carId: modalState.carId,
        }).unwrap();

        setSelectedCars((prev) => ({
          ...prev,
          [modalState.driverId!]: modalState.carName!,
        }));

        // Явно перезапускаем запрос getDrivers
        refetchDrivers();

        setModalState({
          isOpen: false,
          driverId: null,
          driverName: null,
          carId: null,
          carName: null,
        });
        toast.success("Машина успешно назначена!");
      } catch (error: any) {
        console.error("Ошибка при обновлении машины:", error);
        const errorMessage =
          error?.user?.[0] ||
          error?.car?.[0] ||
          error?.message ||
          "Не удалось назначить машину.";
        toast.error(errorMessage);
      }
    } else {
      toast.error("Не выбраны водитель или машина.");
    }
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      driverId: null,
      driverName: null,
      carId: null,
      carName: null,
    });
  };

  if (isDriversLoading || isCarsLoading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  return (
    <div className="w-screen overflow-x-hidden">
      <table className="min-w-full border-collapse border border-gray-300 m-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
              Имя
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
              Машина
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {driversData?.results.map(
            (driver: PaginatedDrivers["results"][0]) => (
              <tr key={driver.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  {driver.user}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  {selectedCars[driver.id] || driver.car}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-sm">
                  <select
                    value={selectedCars[driver.id] || ""}
                    onChange={(e) => handleCarChange(driver.id, e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled={true}>
                      Выберите машину
                    </option>
                    {carsData?.results.map(
                      (car: CarsResponse["results"][0]) => (
                        <option key={car.id} value={car.id}>
                          {car.name} ({car.number})
                        </option>
                      )
                    )}
                  </select>
                </td>
              </tr>
            )
          )}
          {driversData?.results.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="border border-gray-300 px-4 py-2 text-center text-gray-600"
              >
                Нет доступных водителей
              </td>
            </tr>
          )}
          {carsData?.results.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="border border-gray-300 px-4 py-2 text-center text-gray-600"
              >
                Нет доступных машин
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Modal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        title="Назначение машины"
        message={`Вы уверены, что хотите выбрать машину "${modalState.carName}" для водителя "${modalState.driverName}"?`}
        confirmText="Назначить"
        cancelText="Отмена"
        isLoading={isUpdating}
      />
    </div>
  );
};

export default Cars;
