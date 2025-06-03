import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { useNavigate } from "react-router-dom";
import { registerSchema, type RegisterFormData } from "../../types/authSchema";
import { useRegisterMutation } from "../../api/authApi";
import { setCredentials, logout } from "../../services/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

const Register: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await registerUser(data).unwrap();
      localStorage.setItem("accessToken", response.access);
      localStorage.setItem("refreshToken", response.refresh);
      localStorage.setItem("user", JSON.stringify(response.user));
      dispatch(setCredentials(response));
      reset();
      alert(`Регистрация успешна, ${response.user.name}!`);
      navigate("/"); // Редирект на главную страницу
    } catch (err) {
      console.error("Ошибка регистрации:", err);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if ("status" in error) {
      if (error.status === 404)
        return "API endpoint не найден. Проверьте настройки бэкенда.";
      if (error.status === 400) return "Ошибка регистрации. Проверьте данные.";
      if ("data" in error) {
        if (error.data instanceof ZodError) {
          return error.data.errors.map((e) => e.message).join(", ");
        }
        return JSON.stringify(error.data);
      }
    }
    return "Неизвестная ошибка";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {isAuthenticated ? (
        <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Добро пожаловать, {user?.name}!
          </h2>
          <button
            onClick={() => {
              dispatch(logout());
              navigate("/login");
            }}
            className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
          >
            Выйти
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 bg-white rounded-lg shadow-md w-full max-w-md"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Регистрация</h2>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Имя
            </label>
            <input
              id="name"
              {...register("name")}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите имя"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              {...register("email")}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите пароль"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <p className="text-red-500 text-sm mb-4">
              Ошибка: {getErrorMessage()}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? "Загрузка..." : "Зарегистрироваться"}
          </button>
          <p className="mt-4 text-center">
            Уже есть аккаунт?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Войдите
            </a>
          </p>
        </form>
      )}
    </div>
  );
};

export default Register;
