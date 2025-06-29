import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ZodError } from "zod";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../api/authApi";
import { setCredentials, logout } from "../../services/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { type LoginFormData, loginSchema } from "../../types/authSchema";

const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data).unwrap();
      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
      localStorage.setItem("user", response.user.name);
      localStorage.setItem("email", response.user.email);
      localStorage.setItem("role", response.user.role);
      localStorage.setItem("user_id", response.user.id);
      dispatch(setCredentials(response));
      reset();
      navigate("/");
    } catch (err) {
      console.error("Ошибка логина:", err);
    }
  };

  console.log(login);
  console.log(dispatch);

  const getErrorMessage = () => {
    if (!error) return null;
    if ("status" in error) {
      if (error.status === 404)
        return "API endpoint не найден. Проверьте настройки бэкенда.";
      if (error.status === 401) return "Неверный email или пароль.";
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 absolute inset-0">
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
          <h2 className="text-2xl font-bold mb-4 text-center">Вход</h2>
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
            {isLoading ? "Загрузка..." : "Войти"}
          </button>
          <p className="mt-4 text-center">
            Нет аккаунта?{" "}
            <a href="/register" className="text-blue-500 hover:underline">
              Зарегистрируйтесь
            </a>
          </p>
        </form>
      )}
    </div>
  );
};

export default Login;
