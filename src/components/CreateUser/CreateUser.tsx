import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useCreateUserMutation } from "../../api/usersApi";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Building,
  UserCheck,
  AlertCircle,
} from "lucide-react";

const CreateUser = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    number: "",
    role: "user",
    password: "",
    subdepartment: "",
  });

  const [createUser, { isLoading }] = useCreateUserMutation();
  const navigate = useNavigate();

  const roles = [
    {
      value: "dispetcher",
      label: "Диспетчер",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "user",
      label: "Пользователь",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "driver",
      label: "Водитель",
      color: "bg-green-100 text-green-800",
    },
  ];

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.subdepartment) {
      toast.error("Пожалуйста, заполните поля: имя, email, пароль и отдел", {
        position: "top-right",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Введите корректный email (например, user@example.com)", {
        position: "top-right",
      });
      return;
    }

    if (form.password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов", {
        position: "top-right",
      });
      return;
    }

    if (form.subdepartment.length > 100) {
      toast.error("Название отдела слишком длинное (максимум 100 символов)", {
        position: "top-right",
      });
      return;
    }

    try {
      await createUser(form).unwrap();
      toast.success("Пользователь успешно создан", { position: "top-right" });
      navigate("/");
    } catch (err) {
      const message =
        (err as any)?.data?.detail ||
        (err as any)?.data?.password?.[0] ||
        (err as any)?.data?.subdepartment?.[0] ||
        "Произошла ошибка при создании пользователя";
      toast.error(message, { position: "top-right" });
    }
  };

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100  relative">
      <div className="container max-w-2xl  ml-16 px-4 py-8">
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Назад к пользователям</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Создать пользователя
              </h1>
              <p className="text-slate-600 mt-1">
                Добавьте нового пользователя в систему
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <User className="w-4 h-4" />
                    Полное имя
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Введите полное имя"
                      className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                      required
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Mail className="w-4 h-4" />
                    Email адрес
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="user@example.com"
                      className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Phone className="w-4 h-4" />
                    Номер телефона
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="number"
                      value={form.number}
                      onChange={handleChange}
                      placeholder="+996 555 55 55 55"
                      className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Lock className="w-4 h-4" />
                    Пароль
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Минимум 6 символов"
                      className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Используйте надежный пароль
                  </p>
                </div>

                {/* Department Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Building className="w-4 h-4" />
                    Отдел
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="subdepartment"
                      value={form.subdepartment}
                      onChange={handleChange}
                      placeholder="Название отдела"
                      className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                      required
                    />
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <UserCheck className="w-4 h-4" />
                    Роль пользователя
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <label
                        key={role.value}
                        className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                          form.role === role.value
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={form.role === role.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${role.color}`}
                          >
                            {role.label}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Создание пользователя...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        Создать пользователя
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-6 bg-blue-50/50 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50 absolute top-35 right-80 ">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Важная информация:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Все поля отмеченные * являются обязательными</li>
                  <li>• Пароль должен содержать минимум 6 символов</li>
                  <li>• Email должен быть уникальным в системе</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </div>
  );
};

export default CreateUser;
