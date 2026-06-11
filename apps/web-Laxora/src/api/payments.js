import { makeResource, request } from "./client.js";

export const paymentsApi = {
  ...makeResource("/api/payments"),
  financeSummary: () => request("/api/payments/finance-summary"),
  writeOff: (body) => request("/api/payments/write-off", { method: "POST", body }),
  createPortalLink: (invoiceId) => request(`/api/payments/portal-link/${invoiceId}`, { method: "POST" }),
  portalInvoice: (paymentCode) => request(`/api/payments/portal/${paymentCode}`),
  submitPortalPayment: (paymentCode, body) => request(`/api/payments/portal/${paymentCode}/pay`, { method: "POST", body }),
  reconcile: (id, body) => request(`/api/payments/${id}/reconcile`, { method: "POST", body }),
};
