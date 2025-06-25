import { useState, useRef, memo, useCallback } from "react";
import { toast } from "react-toastify";
import {
  useLazyDownloadDriverLoadReportQuery,
  useLazyDownloadRequestsReportQuery,
  useLazyDownloadUserActivityReportQuery,
  useLazyDownloadWaybillReportQuery,
  useLazyDownloadRouteSheetReportQuery,
} from "../../api/reportApi";
import { useGetCarsQuery } from "../../api/carsApi";
import { TOAST_POSITION } from "../../ui/constants";
import React from "react";

interface InputFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  className?: string;
  [key: string]: any;
}

const InputField = memo(
  ({
    label,
    id,
    type = "text",
    value,
    onChange,
    className = "",
    ...props
  }: InputFieldProps) => {
    console.log(`Rendering InputField: ${id}`); // Debug log
    return (
      <div className={className}>
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
        </label>
        {type === "select" ? (
          <select
            id={id}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
            {...props}
          >
            {props.children}
          </select>
        ) : (
          <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            {...props}
          />
        )}
      </div>
    );
  }
);

interface ReportCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ReportCard = ({
  title,
  description,
  icon,
  children,
}: ReportCardProps) => (
  <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 mr-2 text-white"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4l4-4-4-4v4a8 8 0 00-8 8z"
    />
  </svg>
);

const DownloadButton = ({
  onClick,
  disabled,
  loading,
  children,
  icon,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
  loading: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      group relative px-6 py-3 rounded-xl font-semibold text-white
      transition-all duration-300 transform hover:scale-105 active:scale-95
      shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300
      ${
        disabled
          ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-70"
          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      }
    `}
  >
    <div className="flex items-center justify-center space-x-2">
      {loading ? (
        <>
          <LoadingSpinner />
          <span>Скачивание...</span>
        </>
      ) : (
        <>
          <span className="text-xl">{icon}</span>
          <span>{children}</span>
        </>
      )}
    </div>
    {!disabled && !loading && (
      <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
    )}
  </button>
);

interface RouteSheetFormProps {
  carsData: any;
  isCarsLoading: boolean;
  onSubmit: (data: {
    fromDate: string;
    toDate: string;
    carId: string;
    waybillNumber: string;
    extendedTo: string;
  }) => void;
  isDownloading: boolean;
  htmlContent: string | null;
  onPrint: () => void;
}

const RouteSheetForm = memo(
  ({
    carsData,
    isCarsLoading,
    onSubmit,
    isDownloading,
    htmlContent,
    onPrint,
  }: RouteSheetFormProps) => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [carId, setCarId] = useState("");
    const [waybillNumber, setWaybillNumber] = useState("");
    const [extendedTo, setExtendedTo] = useState("");

    const handleSubmit = useCallback(() => {
      onSubmit({ fromDate, toDate, carId, waybillNumber, extendedTo });
    }, [fromDate, toDate, carId, waybillNumber, extendedTo, onSubmit]);

    console.log("Rendering RouteSheetForm"); // Debug log

    return (
      <div className="space-y-6">
        <p className="text-gray-600">
          Сформируйте HTML-отчет по маршрутным листам для выбранного автомобиля
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Дата с"
            id="route_sheet_from_date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <InputField
            label="Дата по"
            id="route_sheet_to_date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <InputField
            label="Дата продления"
            id="route_sheet_extended_to"
            type="date"
            value={extendedTo}
            onChange={(e) => setExtendedTo(e.target.value)}
          />
          <InputField
            label="Номер путевого листа"
            id="route_sheet_waybill_number"
            type="text"
            value={waybillNumber}
            onChange={(e) => setWaybillNumber(e.target.value)}
          />
        </div>
        <InputField
          label="Выберите автомобиль"
          id="route_sheet_car_id"
          type="select"
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
          disabled={isCarsLoading}
          className="col-span-full"
        >
          <option value="">
            {isCarsLoading ? "Загрузка..." : "Выберите машину"}
          </option>
          {carsData?.results?.map((car: any) => (
            <option key={car.id} value={car.id_car}>
              {car.name} (№{car.number})
            </option>
          ))}
        </InputField>

        <DownloadButton
          onClick={handleSubmit}
          disabled={
            isDownloading ||
            !fromDate ||
            !toDate ||
            !carId ||
            !waybillNumber ||
            !extendedTo ||
            isCarsLoading
          }
          loading={isDownloading}
          icon="📄"
        >
          Сформировать HTML
        </DownloadButton>

        {htmlContent && (
          <DownloadButton
            onClick={onPrint}
            disabled={false}
            loading={false}
            icon="🖨️"
          >
            Сохранить как PDF
          </DownloadButton>
        )}
      </div>
    );
  }
);

const Report = () => {
  const [isDriverReportDownloading, setIsDriverReportDownloading] =
    useState(false);
  const [isRequestsReportDownloading, setIsRequestsReportDownloading] =
    useState(false);
  const [isUserActivityReportDownloading, setIsUserActivityReportDownloading] =
    useState(false);
  const [isWaybillReportDownloading, setIsWaybillReportDownloading] =
    useState(false);
  const [isRouteSheetReportDownloading, setIsRouteSheetReportDownloading] =
    useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [waybillFromDate, setWaybillFromDate] = useState("");
  const [waybillToDate, setWaybillToDate] = useState("");
  const [waybillCarId, setWaybillCarId] = useState("");
  const htmlContentRef = useRef<HTMLDivElement>(null);
  const [waybillHtmlContent, setWaybillHtmlContent] = useState<string | null>(
    null
  );
  const [routeSheetHtmlContent, setRouteSheetHtmlContent] = useState<
    string | null
  >(null);
  const waybillIframeRef = useRef<HTMLIFrameElement>(null);
  const routeSheetIframeRef = useRef<HTMLIFrameElement>(null);

  const {
    data: carsData,
    isLoading: isCarsLoading,
    error: carsError,
  } = useGetCarsQuery({
    limit: 100,
    offset: 0,
  });

  const [triggerDriverReport] = useLazyDownloadDriverLoadReportQuery();
  const [triggerRequestsReport] = useLazyDownloadRequestsReportQuery();
  const [triggerUserActivityReport] = useLazyDownloadUserActivityReportQuery();
  const [triggerWaybillReport] = useLazyDownloadWaybillReportQuery();
  const [triggerRouteSheetReport] = useLazyDownloadRouteSheetReportQuery();

  const handleDownloadDriverReport = async () => {
    setIsDriverReportDownloading(true);
    try {
      const blob = await triggerDriverReport().unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "driver_load_report.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Отчет по загрузке водителей успешно скачан!", {
        position: TOAST_POSITION,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось скачать отчет по водителям";
      toast.error(errorMessage, { position: TOAST_POSITION });
    } finally {
      setIsDriverReportDownloading(false);
    }
  };

  const handleDownloadRequestsReport = async () => {
    setIsRequestsReportDownloading(true);
    try {
      const blob = await triggerRequestsReport().unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "requests_report.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Отчет по заявкам успешно скачан!", {
        position: TOAST_POSITION,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось скачать отчет по заявкам";
      toast.error(errorMessage, { position: TOAST_POSITION });
    } finally {
      setIsRequestsReportDownloading(false);
    }
  };

  const handleDownloadUserActivityReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Выберите начальную и конечную дату", {
        position: TOAST_POSITION,
      });
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("Конечная дата не может быть раньше начальной", {
        position: TOAST_POSITION,
      });
      return;
    }
    setIsUserActivityReportDownloading(true);
    try {
      const blob = await triggerUserActivityReport({
        start_date: startDate,
        end_date: endDate,
      }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "user_activity_report.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Отчет по активности пользователей успешно скачан!", {
        position: TOAST_POSITION,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось скачать отчет по активности пользователей";
      toast.error(errorMessage, { position: TOAST_POSITION });
    } finally {
      setIsUserActivityReportDownloading(false);
    }
  };

  const handleDownloadWaybillReport = async () => {
    if (!waybillFromDate || !waybillToDate || !waybillCarId) {
      toast.error("Заполните все поля для отчета по путевым листам", {
        position: TOAST_POSITION,
      });
      return;
    }
    if (new Date(waybillToDate) < new Date(waybillFromDate)) {
      toast.error("Конечная дата не может быть раньше начальной", {
        position: TOAST_POSITION,
      });
      return;
    }
    const carIdNum = parseInt(waybillCarId);
    if (isNaN(carIdNum)) {
      toast.error("Неверный ID машины", { position: TOAST_POSITION });
      return;
    }
    setIsWaybillReportDownloading(true);
    try {
      const htmlContent = await triggerWaybillReport({
        from_date: waybillFromDate,
        to_date: waybillToDate,
        car_id: carIdNum,
      }).unwrap();
      setWaybillHtmlContent(htmlContent);
      toast.success("Отчет по путевым листам готов к печати", {
        position: TOAST_POSITION,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось получить отчет по путевым листам";
      toast.error(errorMessage, { position: TOAST_POSITION });
    } finally {
      setIsWaybillReportDownloading(false);
    }
  };

  const handleDownloadRouteSheetReport = async (data: {
    fromDate: string;
    toDate: string;
    carId: string;
    waybillNumber: string;
    extendedTo: string;
  }) => {
    if (
      !data.fromDate ||
      !data.toDate ||
      !data.carId ||
      !data.waybillNumber ||
      !data.extendedTo
    ) {
      toast.error("Заполните все поля для отчета по маршрутным листам", {
        position: TOAST_POSITION,
      });
      return;
    }
    if (new Date(data.toDate) < new Date(data.fromDate)) {
      toast.error("Конечная дата не может быть раньше начальной", {
        position: TOAST_POSITION,
      });
      return;
    }
    if (new Date(data.extendedTo) < new Date(data.toDate)) {
      toast.error("Дата продления не может быть раньше конечной даты", {
        position: TOAST_POSITION,
      });
      return;
    }
    const carIdNum = parseInt(data.carId);
    if (isNaN(carIdNum)) {
      toast.error("Неверный ID машины", { position: TOAST_POSITION });
      return;
    }
    setIsRouteSheetReportDownloading(true);
    try {
      const htmlContent = await triggerRouteSheetReport({
        from_date: data.fromDate,
        to_date: data.toDate,
        car_id: carIdNum,
        waybill_number: data.waybillNumber,
        extended_to: data.extendedTo,
      }).unwrap();
      setRouteSheetHtmlContent(htmlContent);
      toast.success("Отчет по маршрутным листам готов к печати", {
        position: TOAST_POSITION,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось получить отчет по маршрутным листам";
      toast.error(errorMessage, { position: TOAST_POSITION });
    } finally {
      setIsRouteSheetReportDownloading(false);
    }
  };

  const handlePrintWaybillReport = () => {
    const iframe = waybillIframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handlePrintRouteSheetReport = () => {
    const iframe = routeSheetIframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  if (carsError) {
    toast.error("Ошибка загрузки списка машин", { position: TOAST_POSITION });
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <span className="text-4xl text-white">📊</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Центр отчетов
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Генерируйте и скачивайте подробные отчеты для анализа работы системы
          </p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Driver Load Report */}
          <ReportCard
            title="Загрузка водителей"
            description="Анализ эффективности работы водителей"
            icon="🚛"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Получите детальную информацию о загрузке каждого водителя в
                формате Excel
              </p>
              <DownloadButton
                onClick={handleDownloadDriverReport}
                disabled={isDriverReportDownloading}
                loading={isDriverReportDownloading}
                icon="📥"
              >
                Скачать отчет
              </DownloadButton>
            </div>
          </ReportCard>

          {/* Requests Report */}
          <ReportCard
            title="Отчет по заявкам"
            description="Статистика обработки заявок"
            icon="📋"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Полная статистика по всем заявкам в системе
              </p>
              <DownloadButton
                onClick={handleDownloadRequestsReport}
                disabled={isRequestsReportDownloading}
                loading={isRequestsReportDownloading}
                icon="📥"
              >
                Скачать отчет
              </DownloadButton>
            </div>
          </ReportCard>

          {/* User Activity Report */}
          <ReportCard
            title="Активность пользователей"
            description="Мониторинг пользовательской активности"
            icon="👥"
          >
            <div className="space-y-6">
              <p className="text-gray-600">
                Отследите активность пользователей за выбранный период
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Начальная дата"
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <InputField
                  label="Конечная дата"
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <DownloadButton
                onClick={handleDownloadUserActivityReport}
                disabled={
                  isUserActivityReportDownloading || !startDate || !endDate
                }
                loading={isUserActivityReportDownloading}
                icon="📥"
              >
                Скачать отчет
              </DownloadButton>
            </div>
          </ReportCard>

          {/* Waybill Report */}
          <ReportCard
            title="Путевые листы"
            description="Детальные отчеты по путевым листам"
            icon="🗂️"
          >
            <div className="space-y-6">
              <p className="text-gray-600">
                Сформируйте HTML-отчет по путевым листам для выбранного
                автомобиля
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Дата с"
                  id="waybill_from_date"
                  type="date"
                  value={waybillFromDate}
                  onChange={(e) => setWaybillFromDate(e.target.value)}
                />
                <InputField
                  label="Дата по"
                  id="waybill_to_date"
                  type="date"
                  value={waybillToDate}
                  onChange={(e) => setWaybillToDate(e.target.value)}
                />
              </div>
              <InputField
                label="Выберите автомобиль"
                id="waybill_car_id"
                type="select"
                value={waybillCarId}
                onChange={(e) => setWaybillCarId(e.target.value)}
                disabled={isCarsLoading}
                className="col-span-full"
              >
                <option value="">
                  {isCarsLoading ? "Загрузка..." : "Выберите машину"}
                </option>
                {carsData?.results?.map((car: any) => (
                  <option key={car.id} value={car.id_car}>
                    {car.name} (№{car.number})
                  </option>
                ))}
              </InputField>

              <DownloadButton
                onClick={handleDownloadWaybillReport}
                disabled={
                  isWaybillReportDownloading ||
                  !waybillFromDate ||
                  !waybillToDate ||
                  !waybillCarId ||
                  isCarsLoading
                }
                loading={isWaybillReportDownloading}
                icon="📄"
              >
                Сформировать HTML
              </DownloadButton>

              {waybillHtmlContent && (
                <DownloadButton
                  onClick={handlePrintWaybillReport}
                  disabled={false}
                  loading={false}
                  icon="🖨️"
                >
                  Сохранить как PDF
                </DownloadButton>
              )}
            </div>
          </ReportCard>

          {/* Route Sheet Report */}
          <ReportCard
            title="Маршрутные листы"
            description="Детальные отчеты по маршрутным листам"
            icon="🛤️"
          >
            <RouteSheetForm
              carsData={carsData}
              isCarsLoading={isCarsLoading}
              onSubmit={handleDownloadRouteSheetReport}
              isDownloading={isRouteSheetReportDownloading}
              htmlContent={routeSheetHtmlContent}
              onPrint={handlePrintRouteSheetReport}
            />
          </ReportCard>
        </div>

        {waybillHtmlContent && (
          <iframe
            ref={waybillIframeRef}
            title="Waybill PDF Frame"
            srcDoc={waybillHtmlContent}
            style={{ display: "none" }}
          />
        )}
        {routeSheetHtmlContent && (
          <iframe
            ref={routeSheetIframeRef}
            title="Route Sheet PDF Frame"
            srcDoc={routeSheetHtmlContent}
            style={{ display: "none" }}
          />
        )}
      </div>

      <div ref={htmlContentRef} style={{ display: "none" }} />
    </div>
  );
};

export default Report;
