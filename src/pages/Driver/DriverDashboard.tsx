import { useAppSelector } from "../../store/hooks";
import HistoryRoutesPage from "../../components/HistoryRoutesPage/HistoryRoutesPage";

const DriverDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className=" bg-white rounded-lg shadow-md w-full  mx-auto  bg-gradient-to-br from-blue-50 to-white ">
      <div className="p-6 text-center">
        <h2 className="text-3xl font-bold mb-4 ">Панель водителя</h2>
        <p className="text-2xl">
          Добро пожаловать, <b>{user?.name.toUpperCase()}</b>! Здесь вы можете
          видеть назначенные поездки.
        </p>
      </div>
      <HistoryRoutesPage />
    </div>
  );
};

export default DriverDashboard;
