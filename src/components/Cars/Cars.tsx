import { useGetCarsQuery, useUpdateDriverCarMutation } from "../../api/carsApi";
import { useState } from "react";
import { toast } from "react-toastify";
import { useGetDriversQuery } from "../../api/requestsApi";
import Modal from "../../ui/Modal";
import type { PaginatedDrivers } from "../../types/requestsSchema";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { DEFAULT_LIMIT, TOAST_POSITION } from "../../ui/constants";
import type { CarsResponse } from "../../types/carsSchema";

interface ApiError {
  status: number;
  data?: {
    user?: string[];
    car?: string[];
    detail?: string;
  };
}

interface SerializedError {
  message?: string;
}

type FetchError = ApiError | SerializedError;

interface CarAssignmentData {
  driverId: string;
  driverName: string;
  carId: string;
  carName: string;
}

const DriverCarAssignment = () => {
  const {
    data: driversData,
    isLoading: isDriversLoading,
    error: driversError,
  } = useGetDriversQuery({ limit: DEFAULT_LIMIT });

  const {
    data: carsData,
    isLoading: isCarsLoading,
    error: carsError,
  } = useGetCarsQuery(
    { limit: DEFAULT_LIMIT, offset: 0 },
    { skip: !driversData }
  );

  const [updateDriverCar, { isLoading: isUpdating }] =
    useUpdateDriverCarMutation();
  const [selectedCars, setSelectedCars] = useState<Record<string, string>>({});

  const {
    isOpen: isModalOpen,
    openModal,
    closeModal,
    confirm,
    data: modalData,
  } = useConfirmModal<CarAssignmentData>();

  const findDriverById = (driverId: string) => {
    return driversData?.results.find(
      (driver: PaginatedDrivers["results"][0]) => driver.id === driverId
    );
  };

  const findCarById = (carId: string) => {
    return carsData?.results.find(
      (car: CarsResponse["results"][0]) => car.id === carId
    );
  };

  const handleCarChange = (driverId: string, carId: string) => {
    const selectedDriver = findDriverById(driverId);
    const selectedCar = findCarById(carId);

    if (!selectedDriver) {
      toast.error("Водитель не найден", { position: TOAST_POSITION });
      return;
    }

    if (!selectedCar) {
      toast.error("Машина не найдена", { position: TOAST_POSITION });
      return;
    }

    openModal({
      driverId,
      driverName: selectedDriver.user,
      carId: selectedCar.id,
      carName: selectedCar.name,
    });
  };

  const handleConfirm = async () => {
    if (!modalData) return;

    const { driverId, driverName, carId, carName } = modalData;

    try {
      await updateDriverCar({
        driverId,
        driverName,
        carId,
      }).unwrap();

      setSelectedCars((prev) => ({
        ...prev,
        [driverId]: carName,
      }));

      confirm();
      toast.success("Машина успешно назначена!", { position: TOAST_POSITION });
    } catch (error) {
      const errorMessage = getErrorMessage(error as FetchError);
      toast.error(errorMessage, { position: TOAST_POSITION });
    }
  };

  const getErrorMessage = (error: FetchError): string => {
    if ("status" in error && error.data) {
      return (
        error.data.user?.[0] ||
        error.data.car?.[0] ||
        error.data.detail ||
        "Не удалось назначить машину"
      );
    }
    return "message" in error ? error.message || "Не удалось назначить машину" : "Не удалось назначить машину";
  };

  const hasDrivers = (driversData?.results?.length ?? 0) > 0;
  const hasCars = (carsData?.results?.length ?? 0) > 0;

  if (isDriversLoading || isCarsLoading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  if (driversError || carsError) {
    return (
      <div className="text-center py-4 text-red-600">
        Ошибка загрузки данных
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Назначение машин водителям</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                Водитель
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                Текущая машина
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                Назначить машину
              </th>
            </tr>
          </thead>
          <tbody>
            {hasDrivers ? (
              driversData?.results?.map(
                (driver: PaginatedDrivers["results"][0]) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {driver.user}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {selectedCars[driver.id] || driver.car || "Не назначена"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-sm">
                      <select
                        value=""
                        onChange={(e) =>
                          handleCarChange(driver.id, e.target.value)
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        disabled={!hasCars}
                      >
                        <option value="" disabled>
                          {hasCars ? "Выберите машину" : "Нет доступных машин"}
                        </option>
                        {hasCars &&
                          carsData?.results?.map(
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
              )
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="border border-gray-300 px-4 py-2 text-center text-gray-600"
                >
                  Нет доступных водителей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title="Назначение машины"
        message={
          modalData && (
            <>
              Назначить машину{" "}
              <span className="font-semibold">{modalData.carName}</span>{" "}
              водителю{" "}
              <span className="font-semibold">{modalData.driverName}</span>?
            </>
          )
        }
        confirmText="Назначить"
        cancelText="Отмена"
        isLoading={isUpdating}
      />
    </div>
  );
};

export default DriverCarAssignment;
