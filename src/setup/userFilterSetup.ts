const roles = ["dispetcher", "user", "driver"] as const;

export const filterFields = [
  {
    type: "text" as const,
    key: "name",
    label: "Имя",
    placeholder: "Поиск по имени",
  },
  {
    type: "text" as const,
    key: "email",
    label: "Email",
    placeholder: "Поиск по email",
  },
  {
    type: "select" as const,
    key: "role",
    label: "Роль",
    placeholder: "Все роли",
    options: roles.map((role) => ({
      value: role,
      label: role.charAt(0).toUpperCase() + role.slice(1),
    })),
  },
];
