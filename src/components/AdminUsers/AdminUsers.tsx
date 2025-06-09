import { useAppSelector } from "../../store/hooks";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import Table from "../Table/Table";
import Modal from "../../ui/Modal";
import Pagination from "../../ui/Pagination";
import {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  type User,
} from "../../api/usersApi";
import { getUserColumns } from "../../setup/userTableSetup";
import Filters from "../Filters/Filters";
import { filterFields } from "../../setup/userFilterSetup";
import { Link } from "react-router-dom";

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    role: "",
  });

  const {
    data: { users = [], count = 0 } = {},
    isLoading: isUsersLoading,
    error,
  } = useGetUsersQuery({
    limit,
    offset,
    name: filters.name,
    email: filters.email,
    role: filters.role,
  });

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  const handleRoleChange = (user: User, role: string) => {
    if (user.id === currentUser?.id) {
      toast.error("Нельзя изменить свою роль", { position: "top-right" });
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
      toast.success(
        `Роль пользователя ${selectedUserForRole.name} изменена на ${
          newRole.charAt(0).toUpperCase() + newRole.slice(1)
        }`,
        { position: "top-right" }
      );
      setIsRoleModalOpen(false);
      setSelectedUserForRole(null);
      setNewRole(null);
    } catch (err: any) {
      const message = err.data?.detail || "Не удалось изменить роль";
      toast.error(message, { position: "top-right" });
    }
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
    setSelectedUserForRole(null);
    setNewRole(null);
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("Нельзя удалить самого себя", { position: "top-right" });
      return;
    }
    setSelectedUserForDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUserForDelete) return;

    try {
      await deleteUser(selectedUserForDelete.id).unwrap();
      toast.success(
        `Пользователь ${selectedUserForDelete.name} успешно удалён`,
        {
          position: "top-right",
        }
      );
      setIsDeleteModalOpen(false);
      setSelectedUserForDelete(null);
    } catch (err: any) {
      const message = err.data?.detail || "Не удалось удалить пользователя";
      toast.error(message, { position: "top-right" });
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUserForDelete(null);
  };

  const columns = getUserColumns({
    handleRoleChange,
    handleDelete,
    currentUser: currentUser
      ? {
          ...currentUser,
          role: currentUser.role as "dispetcher" | "user" | "driver" | "admin",
        }
      : null,
  });

  const errorMessage = error
    ? "status" in error
      ? `${error.status} ${JSON.stringify(error.data)}`
      : "Неизвестная ошибка"
    : null;

  return (
    <div
      className="px-3 py-4 mx-auto"
      style={{ maxWidth: "1400px", minWidth: "1400px", width: "100%" }}
    >
      <h2 className="text-2xl font-bold mb-6 p-3">Управление пользователями</h2>
      <div className="flex items-center justify-between mb-4 p-3  ">
        <Filters
          fields={filterFields}
          values={filters}
          onChange={handleFilterChange}
        />
        <Link
          to="/admin/users/create"
          className="px-4 py-2 border text-white  border-blue-400  bg-blue-400 transition-colors rounded-md"
        >
          Создать пользователя
        </Link>
      </div>
      <Table
        data={users}
        columns={columns}
        keyExtractor={(user: User) => user.id}
        isLoading={isUsersLoading}
        error={errorMessage}
        limit={limit}
      />
      <Pagination
        limit={limit}
        offset={offset}
        count={count}
        onLimitChange={setLimit}
        onOffsetChange={setOffset}
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
            Удалить пользователя{" "}
            <span className="font-semibold">{selectedUserForDelete?.name}</span>
            ?
          </>
        }
        confirmText="Удалить"
        isLoading={isDeletingUser}
      />
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
  );
};

export default AdminUsers;
