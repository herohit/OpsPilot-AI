import { Navigate, Route, Routes } from "react-router";
import GuestRoutes from "./GuestRoutes";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import Projects from "../pages/Projects";
import CreateProject from "../pages/CreateProject";
import ProjectDetail from "../pages/ProjectDetail";
import Dashboard from "../pages/Dashboard";
import Services from "../pages/Services";
import Environments from "../pages/Environments";
import Deployments from "../pages/Deployments";
import Settings from "../pages/Settings";
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
          <Route path="/services" element={<Services />} />
          <Route path="/environments" element={<Environments />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/projects/new" element={<CreateProject />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/projects" element={<Projects />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default AppRoutes;
