import { baseUrl, makeResource, request } from "./client.js";

export const invoicesApi = {
  ...makeResource("/api/invoices"),
  fromTime: (body) => request("/api/invoices/from-time", { method: "POST", body }),
  fromBillables: (body) => request("/api/invoices/from-billables", { method: "POST", body }),
  autoFromBillables: (body) => request("/api/invoices/from-billables/auto", { method: "POST", body }),
  pendingByClient: (params) => request("/api/invoices/__analytics/pending-by-client", { params }),
  pipeline: (params) => request("/api/invoices/__pipeline", { params }),
  document: (id) => request(`/api/invoices/${id}/document`),
  pdfUrl: (id) => `${baseUrl}/api/invoices/${id}/pdf`,
  finalise: (id, body) => request(`/api/invoices/${id}/finalise`, { method: "POST", body }),
  revise: (id, body) => request(`/api/invoices/${id}/revise`, { method: "POST", body }),
  send: (id, body) => request(`/api/invoices/${id}/send`, { method: "POST", body }),
  void: (id, body) => request(`/api/invoices/${id}/void`, { method: "POST", body }),
  lines: (invoiceId, params) => request(`/api/invoices/${invoiceId}/lines`, { params }),
  createLine: (invoiceId, body) => request(`/api/invoices/${invoiceId}/lines`, { method: "POST", body }),
  updateLine: (invoiceId, lineId, body) => request(`/api/invoices/${invoiceId}/lines/${lineId}`, { method: "PUT", body }),
  removeLine: (invoiceId, lineId) => request(`/api/invoices/${invoiceId}/lines/${lineId}`, { method: "DELETE" }),
};
