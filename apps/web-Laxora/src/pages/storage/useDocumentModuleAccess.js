import { useAuth } from "../../auth/AuthProvider";

function hasPermission(permissions, key) {
  return permissions.includes(key);
}

export function useDocumentModuleAccess() {
  const { moduleNavigation } = useAuth();
  const module = moduleNavigation.modules.find((item) => item.key === "documents");
  const permissions = moduleNavigation.permissions?.permissions || [];
  const dynamicReady = moduleNavigation.status === "ready";
  const unavailable = dynamicReady && module && ["hidden", "disabled"].includes(module.state);
  const readOnly = dynamicReady && Boolean(module?.readOnly || module?.state === "read_only");
  const canRead = !dynamicReady || hasPermission(permissions, "document.read");
  const canCreate = !dynamicReady || (!readOnly && hasPermission(permissions, "document.create"));
  const canShare = !dynamicReady || (!readOnly && hasPermission(permissions, "document.share"));
  const canDelete = !dynamicReady || (!readOnly && hasPermission(permissions, "document.delete"));

  return {
    status: moduleNavigation.status,
    unavailable,
    readOnly,
    canRead,
    canCreate,
    canShare,
    canDelete,
    message: unavailable
      ? module?.reason || "Documents are not available for this workspace."
      : readOnly
        ? module?.reason || "Documents are available for review, but changes are paused for this workspace."
        : "",
  };
}
