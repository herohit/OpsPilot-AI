import { Navigate, Route, Routes } from "react-router";
import GuestRoutes from "./GuestRoutes";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import PageNotFound from "../pages/PageNotFound";
import ProtectedRoute from "./ProtectedRoutes";
import AppLayout from "../layout/AppLayout";


function AppRoutes() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route element={<GuestRoutes />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route path="/register" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default AppRoutes;
