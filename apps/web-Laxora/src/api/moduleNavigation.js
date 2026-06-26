import { request } from "./client.js";
import { getNavigationIcon } from "../routes/routeConfig.js";

function normalizeNavigationItem(item = {}) {
  return {
    label: item.label || "Workspace",
    path: item.path || "/app/dashboard",
    moduleKey: item.moduleKey || "dashboard",
    state: item.state || "enabled",
    reason: item.reason || "",
    readOnly: Boolean(item.readOnly || item.state === "read_only"),
    experimental: Boolean(item.experimental || item.state === "experimental"),
    disabled: Boolean(item.disabled || item.state === "disabled"),
    section: item.section || "primary",
    order: Number(item.order || 100),
    iconKey: item.iconKey || "layout-dashboard",
    icon: getNavigationIcon(item.iconKey),
  };
}

function normalizeModule(module = {}) {
  return {
    key: module.key,
    name: module.name || module.key,
    state: module.state || "enabled",
    allowed: Boolean(module.allowed),
    reason: module.reason || "",
    readOnly: Boolean(module.readOnly || module.state === "read_only"),
    experimental: Boolean(module.experimental || module.state === "experimental"),
    dependenciesReady: module.dependenciesReady !== false,
    requiredPlanKey: module.requiredPlanKey || "",
    featureKeys: module.featureKeys || [],
    permissionKeys: module.permissionKeys || [],
    dependencies: module.dependencies || [],
  };
}

function normalizeNavigationResponse(response = {}) {
  const data = response.data || response;
  return {
    workspaceId: data.workspaceId || "",
    items: (data.navigation || []).map(normalizeNavigationItem),
    modules: (data.modules || []).map(normalizeModule),
    permissions: data.permissions || { permissions: [] },
    validation: data.validation || { ok: true, unknownDependencies: [], cycles: [] },
    message: data.message || "",
  };
}

export const moduleNavigationApi = {
  navigation: async () => normalizeNavigationResponse(await request("/api/workspace/navigation")),
  modules: async () => {
    const response = await request("/api/workspace/modules");
    const data = response.data || response;
    return {
      modules: (data.modules || []).map(normalizeModule),
      validation: data.validation || { ok: true, unknownDependencies: [], cycles: [] },
      message: data.message || "",
    };
  },
};
