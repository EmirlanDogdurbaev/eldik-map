import { useAppSelector } from "../../store/hooks";

const DispatcherDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Панель диспетчера</h2>
      <p>
        Добро пожаловать, {user?.name}! Здесь вы можете управлять поездками.
      </p>
    </div>
  );
};

export default DispatcherDashboard;
