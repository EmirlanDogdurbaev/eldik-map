import type { FilterField } from "../types/types";

export const filterFields: FilterField[] = [
  {
    type: "text",
    key: "name",
    label: "Имя",
    placeholder: "Введите имя",
    required: false,
    hint: undefined, // Or e.g., "Введите имя пользователя"
    options: [], // Or omit if FilterField allows undefined
  },
  {
    type: "text",
    key: "email",
    label: "Email",
    placeholder: "Введите email",
    required: false,
    hint: undefined, // Or e.g., "Введите email адрес"
    options: [], // Or omit if FilterField allows undefined
  },
  {
    type: "select",
    key: "role",
    label: "Роль",
    placeholder: "Выберите роль",
    required: false,
    hint: undefined, // Or e.g., "Выберите роль пользователя"
    options: [
      { value: "user", label: "Пользователь" },
      { value: "driver", label: "Водитель" },
      { value: "dispatcher", label: "Диспетчер" }, // Fixed typo
    ],
  },
];
