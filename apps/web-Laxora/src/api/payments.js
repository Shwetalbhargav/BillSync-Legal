import { makeResource, request } from "./client.js";

export const paymentsApi = {
  ...makeResource("/api/payments"),
  reconcile: (id, body) => request(`/api/payments/${id}/reconcile`, { method: "POST", body }),
};
