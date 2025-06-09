import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useCreateUserMutation } from "../../api/usersApi";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { ArrowLeft } from "lucide-react";
import CustomSelect from "../../ui/Select";

const CreateUser: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    number: "",
    role: "user",
    password: "",
  });

  const [createUser, { isLoading }] = useCreateUserMutation();
  const navigate = useNavigate();

  const roles = ["dispetcher", "user", "driver"] as const;

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { name: string; value: string }
  ) => {
    const name = "target" in e ? e.target.name : e.name;
    const value = "target" in e ? e.target.value : e.value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error("Пожалуйста, заполните поля: имя, email и пароль", {
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

    try {
      await createUser(form).unwrap();
      toast.success("Пользователь успешно создан", { position: "top-right" });
      navigate("/admin/users");
    } catch (err: any) {
      const message =
        err.data?.detail ||
        err.data?.password?.[0] ||
        "Произошла ошибка при создании пользователя";
      toast.error(message, { position: "top-right" });
    }
  };

  const roleOptions = roles.map((role) => ({
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1),
  }));

  const selectedRole = roleOptions.find((opt) => opt.value === form.role);

  return (
    <div className="flex flex-col min-w-screen">
      <Link
        to="/admin/users"
        className="mb-4 text-blue-500 hover:underline px-6 pt-5 inline-flex w-fit gap-1"
      >
        <ArrowLeft /> Назад к пользователям
      </Link>
      <div className="flex min-h-screen">
        <div className="px-5 bg-white rounded-md w-full min-w-md">
          <h2 className="text-2xl font-bold mb-6">Создать пользователя</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Имя"
                className="w-full"
                required
              />
            </div>
            <div>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full"
                required
              />
            </div>
            <div>
              <Input
                type="text"
                name="number"
                value={form.number}
                onChange={handleChange}
                placeholder="+996 555 55 55 55"
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Пароль"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Роль</label>
              <CustomSelect
                options={roleOptions}
                value={selectedRole || null}
                onChange={(option) =>
                  handleChange({ name: "role", value: option?.value || "" })
                }
                placeholder="Выберите роль"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 p-2.5 text-lg text-white rounded-md transition"
            >
              {isLoading ? "Создание..." : "Создать"}
            </Button>
          </form>

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
    </div>
  );
};

export default CreateUser;
