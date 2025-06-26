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
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { capitalize } from "../../utils/stringUtils";
import { TOAST_POSITION } from "../../ui/constants";

interface ApiError {
  status: number;
  data?: {
    detail?: string;
  };
}

interface SerializedError {
  message?: string;
}

type FetchError = ApiError | SerializedError;

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

  const {
    isOpen: isRoleModalOpen,
    openModal: openRoleModal,
    closeModal: closeRoleModal,
    confirm: confirmRoleChange,
    data: roleModalData,
  } = useConfirmModal<{ user: User; role: string }>();

  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
    confirm: confirmDelete,
    data: deleteModalData,
  } = useConfirmModal<User>();

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  const showSelfActionError = (action: string) => {
    toast.error(`Нельзя ${action} самого себя`, { position: TOAST_POSITION });
  };

  const handleRoleChange = (user: User, role: string) => {
    if (user.id === currentUser?.id) {
      showSelfActionError("изменить роль");
      return;
    }
    openRoleModal({ user, role });
  };

  const handleConfirmRoleChange = async () => {
    if (!roleModalData) return;

    const { user, role } = roleModalData;

    try {
      await updateUserRole({
        id: user.id,
        role,
      }).unwrap();

      toast.success(
        `Роль пользователя ${user.name} изменена на ${capitalize(role)}`,
        { position: TOAST_POSITION }
      );

      confirmRoleChange();
    } catch (err) {
      const message = getErrorMessage(
        err as FetchError,
        "Не удалось изменить роль"
      );
      toast.error(message, { position: TOAST_POSITION });
    }
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      showSelfActionError("удалить");
      return;
    }
    openDeleteModal(user);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalData) return;

    try {
      await deleteUser(deleteModalData.id).unwrap();
      toast.success(`Пользователь ${deleteModalData.name} успешно удалён`, {
        position: TOAST_POSITION,
      });
      confirmDelete();
    } catch (err) {
      const message = getErrorMessage(
        err as FetchError,
        "Не удалось удалить пользователя"
      );
      toast.error(message, { position: TOAST_POSITION });
    }
  };

  const getErrorMessage = (
    error: FetchError,
    defaultMessage: string
  ): string => {
    if ("status" in error) {
      return error.data?.detail || defaultMessage;
    }
    return error.message || defaultMessage;
  };

  const columns = getUserColumns({
    handleRoleChange,
    handleDelete,
    currentUser,
  });

  const errorMessage = error
    ? getErrorMessage(error as FetchError, "Неизвестная ошибка")
    : null;

  return (
    <div className="px-1 py-4 mx-auto max-w-7xl min-w-7xl w-full">
      <h2 className="text-2xl font-bold mb-6 p-3">Управление пользователями</h2>

      <div className="flex items-end justify-between mb-4 p-3">
        <Filters
          fields={filterFields}
          values={filters}
          onChange={handleFilterChange}
        />
        <Link
          to="/admin/users/create"
          className="px-4 py-2 border text-white border-blue-400 bg-blue-400 hover:bg-blue-500 hover:border-blue-500 transition-colors rounded-md"
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
        onClose={closeRoleModal}
        onConfirm={handleConfirmRoleChange}
        title="Подтверждение изменения роли"
        message={
          roleModalData && (
            <>
              Действительно ли вы хотите назначить роль{" "}
              <span className="font-semibold">
                {capitalize(roleModalData.role)}
              </span>{" "}
              для пользователя{" "}
              <span className="font-semibold">{roleModalData.user.name}</span>?
            </>
          )
        }
        isLoading={isUpdatingRole}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Подтверждение удаления"
        message={
          deleteModalData && (
            <>
              Удалить пользователя{" "}
              <span className="font-semibold">{deleteModalData.name}</span>?
            </>
          )
        }
        confirmText="Удалить"
        isLoading={isDeletingUser}
      />

      <ToastContainer
        position={TOAST_POSITION}
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
