import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { canAccess } from "../../constants/permissions";

export function ProtectedRoute({ moduleKey, role }) {
  const { moduleNavigation, role: currentRole } = useAuth();
  const effectiveRole = role || currentRole;
  const module = moduleNavigation.status === "ready"
    ? moduleNavigation.modules.find((item) => item.key === moduleKey)
    : null;
  const canOpen = module
    ? module.state !== "hidden" && module.state !== "disabled" && (module.allowed || module.readOnly || module.experimental)
    : canAccess(effectiveRole, moduleKey);

  if (!canOpen) {
    return <Navigate to="/states/permission-needed" replace />;
  }
  return <Outlet />;
}
