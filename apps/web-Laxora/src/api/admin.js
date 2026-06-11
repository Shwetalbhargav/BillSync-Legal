import { makeResource, request } from "./client.js";

export const adminApi = {
  ...makeResource("/api/admin"),
  login: (body) => request("/api/admin/login", { method: "POST", body }),
  register: (body) => request("/api/admin/register", { method: "POST", body }),
  me: () => request("/api/admin/me"),
  updateMe: (body) => request("/api/admin/me", { method: "PATCH", body }),
  dashboard: () => request("/api/admin/dashboard"),
};
