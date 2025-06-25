import { useAppSelector } from "../../store/hooks";
import HistoryRoutesPage from "../../components/HistoryRoutesPage/HistoryRoutesPage";

const DriverDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Панель водителя</h2>
      <p>
        Добро пожаловать, {user?.name}! Здесь вы можете видеть назначенные
        поездки.
      </p>
      <HistoryRoutesPage />
    </div>
  );
};

export default DriverDashboard;
