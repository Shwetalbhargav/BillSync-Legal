import { Navigate, Outlet } from "react-router-dom";
import { canAccess } from "../../constants/permissions";

export function ProtectedRoute({ moduleKey, role }) {
  if (!canAccess(role, moduleKey)) {
    return <Navigate to="/states/permission-needed" replace />;
  }
  return <Outlet />;
}
