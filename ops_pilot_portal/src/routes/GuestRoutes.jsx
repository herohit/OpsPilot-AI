import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../store/authStore";

const GuestRoutes = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isLoading = useAuthStore(
    (state) => state.isLoading
  );

    if (isLoading) {
        return <div role="status" className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default GuestRoutes;