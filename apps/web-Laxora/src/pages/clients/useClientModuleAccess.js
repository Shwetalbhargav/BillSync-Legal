import { useAuth } from "../../auth/AuthProvider";

const writeFallbackPermissions = new Set(["clients.write"]);

function hasPermission(permissions, key, fallbackKeys = []) {
  return permissions.includes(key) || fallbackKeys.some((fallbackKey) => permissions.includes(fallbackKey));
}

export function useClientModuleAccess() {
  const { moduleNavigation } = useAuth();
  const module = moduleNavigation.modules.find((item) => item.key === "clients");
  const permissions = moduleNavigation.permissions?.permissions || [];
  const dynamicReady = moduleNavigation.status === "ready";
  const unavailable = dynamicReady && module && ["hidden", "disabled"].includes(module.state);
  const readOnly = dynamicReady && Boolean(module?.readOnly || module?.state === "read_only");
  const canRead = !dynamicReady || hasPermission(permissions, "client.read", ["clients.read"]);
  const canCreate = !dynamicReady || (!readOnly && hasPermission(permissions, "client.create", [...writeFallbackPermissions]));
  const canEdit = !dynamicReady || (!readOnly && hasPermission(permissions, "client.edit", [...writeFallbackPermissions]));
  const canDelete = !dynamicReady || (!readOnly && hasPermission(permissions, "client.delete", [...writeFallbackPermissions]));

  return {
    status: moduleNavigation.status,
    unavailable,
    readOnly,
    canRead,
    canCreate,
    canEdit,
    canDelete,
    message: unavailable
      ? module?.reason || "Clients are not available for this workspace."
      : readOnly
        ? module?.reason || "Clients are available for review, but changes are paused for this workspace."
        : "",
  };
}
