import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Home from "./pages/Home";
import Layout from "./components/Layout/Layout";
import MapPage from "./pages/MapPage";
import AccessDenied from "./components/AccessDenied/AccessDenied";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";
import AdminUsers from "./components/AdminUsers/AdminUsers";
import CreateUser from "./components/CreateUser/CreateUser";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/403" element={<AccessDenied />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/create" element={<CreateUser />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["dispatcher"]} />}>
          <Route
            path="/dispatcher/dashboard"
            element={<div>dispatcher page</div>}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/user/dashboard" element={<Home />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver/dashboard" element={<div>driver page</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
