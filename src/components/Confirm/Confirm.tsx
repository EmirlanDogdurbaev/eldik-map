import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type VerifyFormData, verifySchema } from "../../types/authSchema";
import { useConfirmMutation } from "../../api/authApi";
import { setCredentials } from "../../services/authSlice";
import { useAppDispatch } from "../../store/hooks";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";

interface ConfirmProps {
  email: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const Confirm: React.FC<ConfirmProps> = ({ email, onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email },
  });

  const [confirmUser, { isLoading, error }] = useConfirmMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data: VerifyFormData) => {
    try {
      const response = await confirmUser(data).unwrap();
      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
      localStorage.setItem("user", response.user.name);
      localStorage.setItem("email", response.user.email);
      localStorage.setItem("role", response.user.role);
      localStorage.setItem("user_id", response.user.id);
      dispatch(setCredentials(response));
      reset();
      onClose();
      if (onSuccess) onSuccess();
      navigate("/");
    } catch (err: any) {
      console.error("Ошибка подтверждения:", err);
      if (err.status === 400 && err.data?.code) {
        setError("code", { message: err.data.code[0] || "Неверный код" });
      } else if (err.status === 400 && err.data?.non_field_errors) {
        setError("root", { message: err.data.non_field_errors[0] });
      } else {
        setError("root", { message: "Произошла ошибка при подтверждении" });
      }
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if ("status" in error) {
      if (error.status === 404)
        return "API endpoint не найден. Проверьте настройки бэкенда.";
      if (error.status === 401) return "Неверный код подтверждение.";
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Подтверждение email
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="relative">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="mt-1 p-2 pl-10 w-full border border-gray-300 rounded-md bg-gray-100"
                placeholder="Email"
                {...register("email")}
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
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Код подтверждения
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                id="code"
                {...register("code")}
                className="mt-1 p-2 pl-10 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите код"
              />
            </div>
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
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
                Проверка...
              </span>
            ) : (
              "Подтвердить"
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400"
          >
            Отмена
          </button>
        </form>
      </div>
    </div>
  );
};

export default Confirm;
