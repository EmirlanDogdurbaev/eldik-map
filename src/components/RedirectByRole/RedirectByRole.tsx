import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

const RedirectByRole: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "user":
      return <Navigate to="/map" replace />;
    case "admin":
      return <Navigate to="/admin" replace />;
    case "dispetcher":
      return <Navigate to="/dispatcher" replace />;
    case "driver":
      return <Navigate to="/driver/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default RedirectByRole;
