import { useEffect, useState } from "react";
import { aiWorkspaceApi } from "../../api";
import { useAuth } from "../../auth/AuthProvider";

function hasPermission(permissions, key, fallbackKeys = []) {
  return permissions.includes(key) || fallbackKeys.some((fallbackKey) => permissions.includes(fallbackKey));
}

export function useAiPlatformAccess(requiredPermission = "ai.use") {
  const { moduleNavigation } = useAuth();
  const module = moduleNavigation.modules.find((item) => item.key === "ai");
  const permissions = moduleNavigation.permissions?.permissions || [];
  const dynamicReady = moduleNavigation.status === "ready";
  const unavailable = dynamicReady && module && ["hidden", "disabled"].includes(module.state);
  const readOnly = dynamicReady && Boolean(module?.readOnly || module?.state === "read_only");
  const canUse = !dynamicReady || hasPermission(permissions, requiredPermission, ["ai.use", "workspace.read"]);
  const [usageState, setUsageState] = useState({ status: "loading", limit: 0, used: 0, remaining: 0, message: "" });

  async function loadUsage() {
    setUsageState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const usage = await aiWorkspaceApi.usage();
      setUsageState({ status: "ready", ...usage, message: "" });
    } catch (error) {
      setUsageState({ status: "error", limit: 0, used: 0, remaining: 0, message: error?.userMessage || "AI usage could not be refreshed right now." });
    }
  }

  useEffect(() => {
    if (dynamicReady && !unavailable && canUse) loadUsage();
  }, [dynamicReady, unavailable, canUse]);

  const creditDepleted = usageState.status === "ready" && usageState.remaining <= 0;

  return {
    status: moduleNavigation.status,
    unavailable,
    readOnly,
    canUse,
    usage: usageState,
    creditDepleted,
    refreshUsage: loadUsage,
    message: unavailable
      ? module?.reason || "AI is not available for this workspace."
      : readOnly
        ? module?.reason || "AI is available for review, but new AI actions are paused for this workspace."
        : creditDepleted
          ? "AI credits are used up for this workspace. You can try again after credits renew or ask an owner to adjust the plan."
          : "",
  };
}
