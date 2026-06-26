import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { authApi } from "../api/auth.js";
import { moduleNavigationApi } from "../api/moduleNavigation.js";
import { normalizeUser } from "../api/normalizers.js";
import { workspaceMembershipApi } from "../api/workspaceMembership.js";
import { defaultRole } from "../constants/roles.js";

const AuthContext = createContext(null);
const publicAuthPaths = new Set(["/login", "/register", "/invite/accept", "/forgot-password", "/reset-password"]);
const emptyModuleNavigation = { status: "idle", items: [], modules: [], permissions: { permissions: [] }, validation: { ok: true, unknownDependencies: [], cycles: [] }, message: "" };

function friendlyAuthMessage(error) {
  return error?.userMessage || "We could not complete that request right now. Please check the details and try again.";
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [workspaceContext, setWorkspaceContext] = useState({ status: "idle", workspace: null, memberships: [], activeMembership: null, message: "" });
  const [moduleNavigation, setModuleNavigation] = useState(emptyModuleNavigation);
  const [status, setStatus] = useState("loading");
  const [lastMessage, setLastMessage] = useState("");

  const refreshModuleNavigation = useCallback(async () => {
    setModuleNavigation((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const navigation = await moduleNavigationApi.navigation();
      setModuleNavigation({ status: "ready", ...navigation });
      return navigation;
    } catch (error) {
      setModuleNavigation({
        ...emptyModuleNavigation,
        status: "error",
        message: error?.userMessage || "Navigation could not be loaded for this workspace.",
      });
      return null;
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await authApi.currentUser();
      const currentUser = response?.user ? normalizeUser(response.user) : null;
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "guest");
      if (currentUser) {
        try {
          setWorkspaceContext((current) => ({ ...current, status: "loading", message: "" }));
          const context = await workspaceMembershipApi.context();
          setWorkspaceContext({ status: "ready", ...context, message: "" });
          await refreshModuleNavigation();
        } catch (workspaceError) {
          setWorkspaceContext({
            status: "error",
            workspace: null,
            memberships: [],
            activeMembership: null,
            message: workspaceError?.userMessage || "Workspace details could not be loaded.",
          });
          setModuleNavigation({ ...emptyModuleNavigation, status: "error", message: "Navigation could not be loaded for this workspace." });
        }
      } else {
        setWorkspaceContext({ status: "idle", workspace: null, memberships: [], activeMembership: null, message: "" });
        setModuleNavigation(emptyModuleNavigation);
      }
      return currentUser;
    } catch (error) {
      setUser(null);
      setWorkspaceContext({ status: "idle", workspace: null, memberships: [], activeMembership: null, message: "" });
      setModuleNavigation(emptyModuleNavigation);
      setStatus("guest");
      setLastMessage(friendlyAuthMessage(error));
      return null;
    }
  }, [refreshModuleNavigation]);

  useEffect(() => {
    if (publicAuthPaths.has(location.pathname)) {
      setStatus("guest");
      setUser(null);
      setWorkspaceContext({ status: "idle", workspace: null, memberships: [], activeMembership: null, message: "" });
      setModuleNavigation(emptyModuleNavigation);
      return;
    }
    refreshCurrentUser();
  }, [location.pathname, refreshCurrentUser]);

  const login = useCallback(async (credentials) => {
    setLastMessage("");
    const response = await authApi.login(credentials);
    const signedInUser = response?.user ? normalizeUser(response.user) : null;
    if (!signedInUser) {
      throw new Error("We could not open your workspace. Please try again.");
    }
    setUser(signedInUser);
    setStatus("authenticated");
    try {
      const context = await workspaceMembershipApi.context();
      setWorkspaceContext({ status: "ready", ...context, message: "" });
      await refreshModuleNavigation();
    } catch {
      setWorkspaceContext({ status: "error", workspace: null, memberships: [], activeMembership: null, message: "Workspace details could not be loaded." });
      setModuleNavigation({ ...emptyModuleNavigation, status: "error", message: "Navigation could not be loaded for this workspace." });
    }
    return signedInUser;
  }, [refreshModuleNavigation]);

  const register = useCallback(async (profile) => {
    setLastMessage("");
    const response = await authApi.register(profile);
    const registeredUser = response?.user ? normalizeUser(response.user) : null;
    if (registeredUser) {
      setUser(registeredUser);
      setStatus("authenticated");
      try {
        const context = await workspaceMembershipApi.context();
        setWorkspaceContext({ status: "ready", ...context, message: "" });
        await refreshModuleNavigation();
      } catch {
        setWorkspaceContext({ status: "error", workspace: null, memberships: [], activeMembership: null, message: "Workspace details could not be loaded." });
        setModuleNavigation({ ...emptyModuleNavigation, status: "error", message: "Navigation could not be loaded for this workspace." });
      }
    }
    return registeredUser;
  }, [refreshModuleNavigation]);

  const switchWorkspace = useCallback(async (workspaceId) => {
    setLastMessage("");
    setWorkspaceContext((current) => ({ ...current, status: "loading", message: "" }));
    const response = await workspaceMembershipApi.switchWorkspace(workspaceId);
    if (response.user) setUser(response.user);
    const context = await workspaceMembershipApi.context();
    setWorkspaceContext({ status: "ready", ...context, message: "" });
    await refreshModuleNavigation();
    return response;
  }, [refreshModuleNavigation]);

  const logout = useCallback(async () => {
    setLastMessage("");
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setWorkspaceContext({ status: "idle", workspace: null, memberships: [], activeMembership: null, message: "" });
      setModuleNavigation(emptyModuleNavigation);
      setStatus("guest");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || defaultRole,
      workspace: workspaceContext.workspace,
      workspaceContext,
      moduleNavigation,
      status,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      lastMessage,
      login,
      logout,
      register,
      refreshCurrentUser,
      refreshModuleNavigation,
      switchWorkspace,
    }),
    [lastMessage, login, logout, moduleNavigation, refreshCurrentUser, refreshModuleNavigation, register, status, switchWorkspace, user, workspaceContext],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
