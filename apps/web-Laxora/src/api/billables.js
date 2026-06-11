import { makeResource, request } from "./client.js";

export const billablesApi = {
  ...makeResource("/api/billables"),
  pending: (params) => request("/api/billables", { params: { ...params, status: "pending" } }),
  approved: (params) => request("/api/billables", { params: { ...params, status: "approved" } }),
  fromEmail: (emailEntryId, body) => request(`/api/billables/from-email/${emailEntryId}`, { method: "POST", body }),
  approve: (id, body) => request(`/api/billables/${id}/approve`, { method: "POST", body }),
  reject: (id, body) => request(`/api/billables/${id}/reject`, { method: "POST", body }),
};
