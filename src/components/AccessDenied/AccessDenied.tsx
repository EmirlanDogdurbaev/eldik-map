import { Link } from "react-router-dom";

const AccessDenied: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 absolute inset-0 top-0">
      <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">
          Доступ запрещен
        </h2>
        <p className="mb-4">У вас нет прав для доступа к этой странице.</p>
        <Link to="/" className="text-blue-500 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;
