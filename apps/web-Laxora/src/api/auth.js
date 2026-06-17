import { request } from "./client.js";

export const authApi = {
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  currentUser: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  extensionToken: () => request("/api/auth/extension-token", { method: "POST" }),
  desktopHandoffToken: () => request("/api/auth/desktop-handoff-token", { method: "POST" }),
};
