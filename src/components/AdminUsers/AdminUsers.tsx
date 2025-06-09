import { Trash2 } from "lucide-react";
import Table from "../Table/Table";
import {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  type User,
} from "../../api/usersApi";
import { useAppSelector } from "../../store/hooks";
import { useState } from "react";
import Modal from "../../ui/Modal";

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const {
    data: users = [],
    isLoading: isUsersLoading,
    error,
  } = useGetUsersQuery();
  const [updateUserRole, { isLoading: isUpdatingRole }] =
    useUpdateUserRoleMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(
    null
  );
  const [newRole, setNewRole] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] =
    useState<User | null>(null);

  console.log("Загруженные пользователи:", users);

  const roles = ["admin", "dispetcher", "user", "driver"] as const;

  const handleRoleChange = (user: User, role: string) => {
    if (user.id === currentUser?.id) {
      alert("Нельзя изменить свою роль");
      return;
    }
    setSelectedUserForRole(user);
    setNewRole(role);
    setIsRoleModalOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUserForRole || !newRole) return;

    try {
      await updateUserRole({
        id: selectedUserForRole.id,
        role: newRole,
      }).unwrap();
      console.log(
        `Роль пользователя ${selectedUserForRole.id} изменена на ${newRole}`
      );
      setIsRoleModalOpen(false);
      setSelectedUserForRole(null);
      setNewRole(null);
    } catch (err: any) {
      console.error("Ошибка изменения роли:", err);
      const message = err.data?.detail || "Не удалось изменить роль";
      alert(message);
    }
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
    setSelectedUserForRole(null);
    setNewRole(null);
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      alert("Нельзя удалить самого себя");
      return;
    }
    setSelectedUserForDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserForDelete) return;

    try {
      await deleteUser(selectedUserForDelete.id).unwrap();
      console.log(`Пользователь ${selectedUserForDelete.id} удален`);
      setIsDeleteModalOpen(false);
      setSelectedUserForDelete(null);
    } catch (err: any) {
      console.error("Ошибка удаления:", err);
      const message = err.data?.detail || "Не удалось удалить пользователя";
      alert(message);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUserForDelete(null);
  };

  const columns = [
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
          value={user.role}
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

  const errorMessage = error
    ? "status" in error
      ? `Ошибка: ${error.status} ${JSON.stringify(error.data)}`
      : null
    : null;

  return (
    <div
      className="px-3 py-4  mx-auto"
      style={{ maxWidth: "1400px", minWidth: "1500px", width: "100%" }}
    >
      <h2 className="text-2xl font-bold mb-6 p-4">Управление пользователями</h2>
      <Table
        data={users}
        columns={columns}
        keyExtractor={(user: User) => user.id}
        isLoading={isUsersLoading}
        error={errorMessage}
      />
      <Modal
        isOpen={isRoleModalOpen}
        onClose={handleCloseRoleModal}
        onConfirm={handleConfirmRoleChange}
        title="Подтверждение изменения роли"
        message={
          <>
            Действительно ли вы хотите назначить роль{" "}
            <span className="font-semibold">
              {(newRole ?? "").charAt(0).toUpperCase() +
                (newRole ?? "").slice(1)}
            </span>{" "}
            для пользователя{" "}
            <span className="font-semibold">{selectedUserForRole?.name}</span>?
          </>
        }
        isLoading={isUpdatingRole}
      />
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Подтверждение удаления"
        message={
          <>
            Действительно ли вы хотите удалить пользователя{" "}
            <span className="font-semibold">{selectedUserForDelete?.name}</span>
            ?
          </>
        }
        confirmText="Удалить"
        isLoading={isDeletingUser}
      />
    </div>
  );
};

export default AdminUsers;
