import { makeResource, request } from "./client.js";

export const expensesApi = {
  ...makeResource("/api/expenses"),
  approved: (params) => request("/api/expenses", { params: { ...params, status: "approved" } }),
  submit: (id, body) => request(`/api/expenses/${id}/submit`, { method: "POST", body }),
  approve: (id, body) => request(`/api/expenses/${id}/approve`, { method: "POST", body }),
  reject: (id, body) => request(`/api/expenses/${id}/reject`, { method: "POST", body }),
  attachReceipt: (id, body) => request(`/api/expenses/${id}/receipt`, { method: "POST", body }),
};
