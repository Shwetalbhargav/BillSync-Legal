import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth.js";
import { normalizeUser } from "../api/normalizers.js";
import { defaultRole } from "../constants/roles.js";

const AuthContext = createContext(null);

function friendlyAuthMessage(error) {
  return error?.userMessage || "We could not complete that request right now. Please check the details and try again.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [lastMessage, setLastMessage] = useState("");

  const refreshCurrentUser = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await authApi.currentUser();
      const currentUser = response?.user ? normalizeUser(response.user) : null;
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "guest");
      return currentUser;
    } catch (error) {
      setUser(null);
      setStatus("guest");
      setLastMessage(friendlyAuthMessage(error));
      return null;
    }
  }, []);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const login = useCallback(async (credentials) => {
    setLastMessage("");
    const response = await authApi.login(credentials);
    const signedInUser = response?.user ? normalizeUser(response.user) : null;
    if (!signedInUser) {
      throw new Error("We could not open your workspace. Please try again.");
    }
    setUser(signedInUser);
    setStatus("authenticated");
    return signedInUser;
  }, []);

  const register = useCallback(async (profile) => {
    setLastMessage("");
    const response = await authApi.register(profile);
    return response?.user ? normalizeUser(response.user) : null;
  }, []);

  const logout = useCallback(async () => {
    setLastMessage("");
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || defaultRole,
      status,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      lastMessage,
      login,
      logout,
      register,
      refreshCurrentUser,
    }),
    [lastMessage, login, logout, refreshCurrentUser, register, status, user],
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
