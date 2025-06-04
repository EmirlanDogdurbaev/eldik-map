import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { registerSchema, type RegisterFormData } from "../../types/authSchema";
import { useRegisterMutation } from "../../api/authApi";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { User, Mail, Lock, Phone } from "lucide-react";
import Confirm from "../Confirm/Confirm";
import { logout } from "../../services/authSlice";

const Register: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "user" },
  });

  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data).unwrap();
      setRegisteredEmail(data.email);
      setIsModalOpen(true);
      reset();
    } catch (err: any) {
      console.error("Ошибка регистрации:", err);
      if (err.status === 400 && err.data?.email) {
        setError("email", {
          message: err.data.email[0] || "Этот email уже занят",
        });
      } else if (err.status === 400 && err.data?.number) {
        setError("number", {
          message: err.data.number[0] || "Неверный формат телефона",
        });
      } else if (err.status === 400 && err.data?.non_field_errors) {
        setError("root", { message: err.data.non_field_errors[0] });
      } else {
        setError("root", { message: "Произошла ошибка при регистрации" });
      }
    }
  };

  const getErrorMessage = (error: any) => {
    if (!error) return null;
    if ("status" in error) {
      if (error.status === 404) {
        return "API endpoint не найден. Проверьте настройки бэкенда.";
      }
      if (error.status === 400 && error.data?.non_field_errors) {
        return error.data.non_field_errors[0];
      }
      return "Ошибка регистрации. Проверьте данные.";
    }
    return "Неизвестная ошибка";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 absolute inset-0 top-0">
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
            className="w-full bg-red-500 text-white p-3 rounded-md hover:bg-red-600"
          >
            Выйти
          </button>
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 bg-white rounded-lg shadow-md w-full max-w-md flex flex-col gap-4"
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Регистрация</h2>

            <div className="relative">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Имя
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size="20"
                />
                <input
                  id="name"
                  {...register("name")}
                  className="mt-1 p-2 pl-10 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите имя"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-y-1/2/2 text-gray-400"
                  size="20"
                />
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="mt-1 p-2 pl-10 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="relative">
              <label
                htmlFor="number"
                className="block text-sm font-medium text-gray-700"
              >
                Номер телефона
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  id="number"
                  {...register("number")}
                  className="mt-1 p-2 pl-10 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
              {errors.number && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.number.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Пароль
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="mt-1 p-2 pl-10 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите пароль"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <input type="hidden" {...register("role")} value="user" />

            {error && (
              <p className="text-red-500 text-sm mb-4">
                Ошибка: {getErrorMessage(error)}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                    />
                  </svg>
                  Загрузка...
                </span>
              ) : (
                "Зарегистрироваться"
              )}
            </button>

            <p className="mt-4 text-center">
              Уже есть аккаунт?{" "}
              <a href="/login" className="text-blue-500 hover:underline">
                Войдите
              </a>
            </p>
          </form>

          {isModalOpen && (
            <Confirm
              email={registeredEmail}
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => navigate("/")}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Register;
