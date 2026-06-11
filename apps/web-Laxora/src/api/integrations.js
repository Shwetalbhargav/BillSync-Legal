import { makeResource, request } from "./client.js";

export const integrationLogsApi = {
  ...makeResource("/api/integration-logs"),
  stats: (params) => request("/api/integration-logs/stats", { params }),
  byBillable: (billableId) => request(`/api/integration-logs/by-billable/${billableId}`),
  byInvoice: (invoiceId) => request(`/api/integration-logs/by-invoice/${invoiceId}`),
};
