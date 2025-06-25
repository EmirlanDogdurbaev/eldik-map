import {
  useGetCarsQuery,
  useUpdateDriverCarMutation,
  useCreateCarMutation,
} from "../../api/carsApi";
import { useGetDriversQuery } from "../../api/requestsApi";
import { useGetUsersQuery } from "../../api/usersApi";
import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "../../ui/Modal";
import type { PaginatedDrivers } from "../../types/requestsSchema";
import type { User } from "../../types/usersSchema";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { DEFAULT_LIMIT, TOAST_POSITION } from "../../ui/constants";
import type { CarsResponse } from "../../types/carsSchema";

interface ApiError {
  status: number;
  data?: {
    user?: string[];
    car?: string[];
    name?: string[];
    car_type?: string[];
    number?: string[];
    main_driver?: string[];
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

interface NewCarData {
  name: string;
  car_type: string;
  number: string;
  main_driver: string;
}

const DriverCarAssignment = () => {
  const {
    data: driversData,
    isLoading: isDriversLoading,
    error: driversError,
  } = useGetDriversQuery({ limit: 100 });

  const {
    data: carsData,
    isLoading: isCarsLoading,
    error: carsError,
  } = useGetCarsQuery({ limit: 100, offset: 0 }, { skip: !driversData });

  const [isCreateCarModalOpen, setIsCreateCarModalOpen] = useState(false);

  const {
    data: usersData,
    isLoading: isUsersLoading,
    error: usersError,
  } = useGetUsersQuery(
    { limit: DEFAULT_LIMIT, offset: 0, role: "driver" },
    { skip: !isCreateCarModalOpen }
  );

  const [updateDriverCar, { isLoading: isUpdating }] =
    useUpdateDriverCarMutation();
  const [createCar, { isLoading: isCreating }] = useCreateCarMutation();
  const [selectedCars, setSelectedCars] = useState<Record<string, string>>({});
  const [newCarData, setNewCarData] = useState<NewCarData>({
    name: "",
    car_type: "",
    number: "",
    main_driver: "",
  });

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

  const handleCreateCar = async () => {
    try {
      await createCar(newCarData).unwrap();
      setIsCreateCarModalOpen(false);
      setNewCarData({
        name: "",
        car_type: "",
        number: "",
        main_driver: "",
      });
      toast.success("Машина успешно создана!", { position: TOAST_POSITION });
    } catch (error) {
      const errorMessage = getErrorMessage(error as FetchError);
      toast.error(errorMessage, { position: TOAST_POSITION });
    }
  };

  const handleCancelCreateCar = () => {
    setIsCreateCarModalOpen(false);
    setNewCarData({
      name: "",
      car_type: "",
      number: "",
      main_driver: "",
    });
  };

  const getErrorMessage = (error: FetchError): string => {
    if ("status" in error && error.data) {
      return (
        error.data.user?.[0] ||
        error.data.car?.[0] ||
        error.data.name?.[0] ||
        error.data.car_type?.[0] ||
        error.data.number?.[0] ||
        error.data.main_driver?.[0] ||
        error.data.detail ||
        "Не удалось выполнить операцию"
      );
    }
    return "message" in error
      ? error.message || "Не удалось выполнить операцию"
      : "Не удалось выполнить операцию";
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewCarData((prev) => ({ ...prev, [name]: value }));
  };

  const hasDrivers = (driversData?.results?.length ?? 0) > 0;
  const hasCars = (carsData?.results?.length ?? 0) > 0;
  const hasUsers = (usersData?.users?.length ?? 0) > 0;

  if (isDriversLoading || isCarsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">Загрузка данных...</span>
      </div>
    );
  }

  if (driversError || carsError) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-medium mb-2">
            Ошибка загрузки данных
          </div>
          <p className="text-red-500 text-sm">
            Проверьте соединение или обратитесь к администратору
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Назначение машин водителям
          </h1>
          <p className="text-gray-600">
            Управление назначением транспортных средств водителям
          </p>
        </div>
        <button
          onClick={() => setIsCreateCarModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Добавить машину
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">
            Всего водителей
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {driversData?.results?.length || 0}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">
            Доступно машин
          </div>
          <div className="text-2xl font-bold text-green-900">
            {carsData?.results?.length || 0}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Водитель
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Текущая машина
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип машины
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Назначить машину
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hasDrivers ? (
                driversData?.results?.map(
                  (driver: PaginatedDrivers["results"][0]) => {
                    const currentCar = selectedCars[driver.id] || driver.car;
                    const assignedCar = currentCar
                      ? carsData?.results?.find(
                          (car: CarsResponse["results"][0]) =>
                            car.name === currentCar || car.id === currentCar
                        )
                      : null;

                    return (
                      <tr
                        key={driver.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {driver.user.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {driver.user}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {driver.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentCar ? (
                            <div className="text-sm">
                              <div className="text-gray-900 font-medium">
                                {currentCar}
                              </div>
                              {assignedCar && (
                                <div className="text-gray-500">
                                  № {assignedCar.number}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Не назначена
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {assignedCar ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {assignedCar.car_type}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value=""
                            onChange={(e) =>
                              handleCarChange(driver.id, e.target.value)
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            disabled={!hasCars || isUpdating}
                          >
                            <option value="" disabled>
                              {hasCars
                                ? "Выберите машину"
                                : "Нет доступных машин"}
                            </option>
                            {hasCars &&
                              carsData?.results?.map(
                                (car: CarsResponse["results"][0]) => (
                                  <option key={car.id} value={car.id}>
                                    {car.name} (№{car.number}) - {car.car_type}
                                  </option>
                                )
                              )}
                          </select>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-300 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Нет доступных водителей
                      </h3>
                      <p className="text-gray-500">
                        Водители появятся здесь после добавления в систему
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isCreateCarModalOpen}
        onClose={handleCancelCreateCar}
        onConfirm={handleCreateCar}
        title="Добавить новую машину"
        message={
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Название машины
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={newCarData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите название машины"
              />
            </div>
            <div>
              <label
                htmlFor="car_type"
                className="block text-sm font-medium text-gray-700"
              >
                Тип машины
              </label>
              <select
                name="car_type"
                id="car_type"
                value={newCarData.car_type}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите тип машины</option>
                <option value="Грузовой">Грузовой</option>
                <option value="Легковой">Легковой</option>
                <option value="Пассажирский">Пассажирский</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="number"
                className="block text-sm font-medium text-gray-700"
              >
                Номер машины
              </label>
              <input
                type="text"
                name="number"
                id="number"
                value={newCarData.number}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите номер машины"
              />
            </div>
            <div>
              <label
                htmlFor="main_driver"
                className="block text-sm font-medium text-gray-700"
              >
                Основной водитель
              </label>
              <select
                name="main_driver"
                id="main_driver"
                value={newCarData.main_driver}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUsersLoading}
              >
                <option value="">Выберите водителя</option>
                {hasUsers &&
                  usersData?.users?.map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
              {usersError && (
                <p className="mt-2 text-sm text-red-600">
                  Ошибка загрузки водителей
                </p>
              )}
            </div>
          </div>
        }
        confirmText="Создать машину"
        cancelText="Отмена"
        isLoading={isCreating || isUsersLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title="Подтверждение назначения"
        message={
          modalData && (
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-gray-900">
                  Назначить машину{" "}
                  <span className="font-semibold text-blue-600">
                    {modalData.carName}
                  </span>{" "}
                  водителю{" "}
                  <span className="font-semibold text-blue-600">
                    {modalData.driverName}
                  </span>
                  ?
                </p>
              </div>
            </div>
          )
        }
        confirmText="Назначить машину"
        cancelText="Отмена"
        isLoading={isUpdating}
      />
    </div>
  );
};

export default DriverCarAssignment;
