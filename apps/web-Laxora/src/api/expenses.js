import { makeResource, request } from "./client.js";

export const expensesApi = {
  ...makeResource("/api/billables/expenses"),
  approved: (params) => request("/api/billables/expenses", { params: { ...params, status: "approved" } }),
  ready: (params) => request("/api/billables/expenses", { params: { ...params, status: "ready_to_bill" } }),
  submit: (id, body) => request(`/api/billables/${id}`, { method: "PUT", body: { ...body, status: "pending" } }),
  approve: (id, body) => request(`/api/billables/${id}/approve`, { method: "POST", body }),
  reject: (id, body) => request(`/api/billables/${id}/reject`, { method: "POST", body }),
  attachReceipt: (id, body) => request(`/api/billables/${id}`, { method: "PUT", body }),
};
