import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/authStore";

const GuestRoutes = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default GuestRoutes;