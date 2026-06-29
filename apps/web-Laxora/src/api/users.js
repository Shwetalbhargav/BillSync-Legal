import { makeResource, request } from "./client.js";

export const usersApi = {
  ...makeResource("/api/users"),
  me: () => request("/api/users/me"),
  meSelf: () => request("/api/users/me/self"),
  updateMyProfileCompletion: (body) => request("/api/users/me/profile-completion", { method: "PATCH", body }),
  profile: (id) => request(`/api/users/${id}/profile`),
  updateProfile: (id, body) => request(`/api/users/${id}/profile`, { method: "PUT", body }),
  defaultRate: (id) => request(`/api/users/${id}/default-rate`),
};
