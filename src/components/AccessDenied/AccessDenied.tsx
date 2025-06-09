import { Link } from "react-router-dom";

const AccessDenied: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen  absolute inset-0 top-0">
      <div className="p-6 bg-white rounded-lg  w-full max-w-6xl text-center">
        <h2 className="text-5xl font-bold mb-4 text-black">Ошибка 404</h2>
        <p className="mb-6 text-2xl font-light text-gray-600 leading-[1.6]">
          Кажется что-то пошло не так! Страница, которую вы запрашиваете, не
          существует. Возможно она устарела, была удалена, или был введён
          неверный адрес в адресной строке.
        </p>
        <Link
          to="/"
          className="inline-block px-9 rounded-md py-3 bg-blue-500 text-white  shadow-md hover:bg-blue-600 transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;
