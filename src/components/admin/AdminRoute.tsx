import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";

const AdminRoute = () => {
  const { session, isAdmin, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-xs uppercase tracking-[0.3em]">Checking access…</p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname, denied: Boolean(session) }}
      />
    );
  }

  return <Outlet />;
};

export default AdminRoute;

