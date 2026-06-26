import { useAuth } from "../../auth/AuthProvider";

const writeFallbackPermissions = new Set(["matters.write"]);

function hasPermission(permissions, key, fallbackKeys = []) {
  return permissions.includes(key) || fallbackKeys.some((fallbackKey) => permissions.includes(fallbackKey));
}

export function useMatterModuleAccess() {
  const { moduleNavigation } = useAuth();
  const module = moduleNavigation.modules.find((item) => item.key === "matters");
  const permissions = moduleNavigation.permissions?.permissions || [];
  const dynamicReady = moduleNavigation.status === "ready";
  const unavailable = dynamicReady && module && ["hidden", "disabled"].includes(module.state);
  const readOnly = dynamicReady && Boolean(module?.readOnly || module?.state === "read_only");
  const canRead = !dynamicReady || hasPermission(permissions, "matter.read", ["matters.read"]);
  const canCreate = !dynamicReady || (!readOnly && hasPermission(permissions, "matter.create", [...writeFallbackPermissions]));
  const canEdit = !dynamicReady || (!readOnly && hasPermission(permissions, "matter.edit", [...writeFallbackPermissions]));
  const canAssign = !dynamicReady || (!readOnly && hasPermission(permissions, "matter.assign", [...writeFallbackPermissions]));

  return {
    status: moduleNavigation.status,
    unavailable,
    readOnly,
    canRead,
    canCreate,
    canEdit,
    canAssign,
    message: unavailable
      ? module?.reason || "Matters are not available for this workspace."
      : readOnly
        ? module?.reason || "Matters are available for review, but changes are paused for this workspace."
        : "",
  };
}
