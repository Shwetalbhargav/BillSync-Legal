import { request } from "./client.js";

export const analyticsApi = {
  billables: (params) => request("/api/analytics/billables", { params }),
  invoices: (params) => request("/api/analytics/invoices", { params }),
  unbilled: (params) => request("/api/analytics/unbilled", { params }),
  billablesByCaseType: (params) => request("/api/analytics/billables-by-case-type", { params }),
  unbilledByClient: (params) => request("/api/analytics/unbilled-by-client", { params }),
  unbilledByUser: (params) => request("/api/analytics/unbilled-by-user", { params }),
  billedByClient: (params) => request("/api/analytics/billed-by-client", { params }),
  billedByUser: (params) => request("/api/analytics/billed-by-user", { params }),
};
