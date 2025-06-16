import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Home from "./pages/Home";
import Layout from "./components/Layout/Layout";
import MapPage from "./pages/MapPage";
import AccessDenied from "./components/AccessDenied/AccessDenied";
import AdminUsers from "./components/AdminUsers/AdminUsers";
import CreateUser from "./components/CreateUser/CreateUser";
import DispatcherDashboard from "./pages/Dispatcher/DispatcherDashboard";
import RequestDetail from "./components/RequestDetail/RequestDetail";
import Cars from "./components/Cars/Cars";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/403" element={<AccessDenied />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/map" element={<MapPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminUsers />} />
          <Route path="/admin/users/create" element={<CreateUser />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["dispetcher"]} />}>
          <Route path="/dispatcher" element={<DispatcherDashboard />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/cars" element={<Cars />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/user/dashboard" element={<Home />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver/dashboard" element={<div>driver page</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/map" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
