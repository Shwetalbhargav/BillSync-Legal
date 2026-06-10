import { request } from "./client";

export const authApi = {
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  currentUser: () => request("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
};
