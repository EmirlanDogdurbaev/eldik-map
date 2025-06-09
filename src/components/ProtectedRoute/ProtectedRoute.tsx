import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  console.log("Проверка авторизации:", { isAuthenticated, user });

  if (!isAuthenticated || !user) {
    console.log("Не авторизован, перенаправление на /login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.toLowerCase())) {
    console.log(`Роль ${user.role} не в списке разрешенных: ${allowedRoles}`);
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
