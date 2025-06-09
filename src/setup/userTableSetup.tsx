import { Trash2 } from "lucide-react";
import type { User } from "../api/usersApi";

const roles = ["dispetcher", "user", "driver"] as const;

interface UserColumnProps {
  handleRoleChange: (user: User, role: string) => void;
  handleDelete: (user: User) => void;
  currentUser: User | null;
}

export const getUserColumns = ({
  handleRoleChange,
  handleDelete,
  currentUser,
}: UserColumnProps) => [
 
  {
    key: "name",
    header: "Имя",
    render: (user: User) => user.name,
  },
  {
    key: "email",
    header: "Email",
    render: (user: User) => user.email,
  },
  {
    key: "number",
    header: "Телефон",
    render: (user: User) => user.number || "Не указан",
  },
  {
    key: "role",
    header: "Роль",
    render: (user: User) => (
      <select
        value={roles.includes(user.role as any) ? user.role : "user"}
        onChange={(e) => handleRoleChange(user, e.target.value)}
        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={user.id === currentUser?.id}
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </option>
        ))}
      </select>
    ),
  },
  {
    key: "actions",
    header: "Действия",
    render: (user: User) => (
      <button
        onClick={() => handleDelete(user)}
        className="text-red-500 hover:text-red-700 disabled:opacity-50"
        disabled={user.id === currentUser?.id}
      >
        <Trash2 size={20} />
      </button>
    ),
  },
];
