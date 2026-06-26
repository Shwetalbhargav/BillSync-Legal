import { useAuth } from "../../auth/AuthProvider";

function hasPermission(permissions, key, fallbackKeys = []) {
  return permissions.includes(key) || fallbackKeys.some((fallbackKey) => permissions.includes(fallbackKey));
}

export function useReportsModuleAccess() {
  const { moduleNavigation } = useAuth();
  const module = moduleNavigation.modules.find((item) => item.key === "reports");
  const permissions = moduleNavigation.permissions?.permissions || [];
  const dynamicReady = moduleNavigation.status === "ready";
  const unavailable = dynamicReady && module && ["hidden", "disabled"].includes(module.state);
  const readOnly = dynamicReady && Boolean(module?.readOnly || module?.state === "read_only");
  const canView = !dynamicReady || hasPermission(permissions, "report.view", ["reports.read", "finance.read"]);
  const canExport = !dynamicReady || (!readOnly && hasPermission(permissions, "report.export", ["reports.read", "finance.read"]));
  const canManage = !dynamicReady || (!readOnly && hasPermission(permissions, "report.manage"));

  return {
    status: moduleNavigation.status,
    unavailable,
    readOnly,
    canView,
    canExport,
    canManage,
    message: unavailable
      ? module?.reason || "Reports are not available for this workspace."
      : readOnly
        ? module?.reason || "Reports are available for review, but changes are paused for this workspace."
        : "",
  };
}
