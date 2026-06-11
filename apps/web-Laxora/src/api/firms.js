import { makeResource, request } from "./client.js";

export const firmsApi = {
  ...makeResource("/api/firms", { idKey: "firmId" }),
  settings: (firmId) => request(`/api/firms/${firmId}/settings`),
  updateCurrency: (firmId, body) => request(`/api/firms/${firmId}/currency`, { method: "PATCH", body }),
  updateTaxSettings: (firmId, body) => request(`/api/firms/${firmId}/tax-settings`, { method: "PATCH", body }),
  updateBillingPreferences: (firmId, body) => request(`/api/firms/${firmId}/billing-preferences`, { method: "PATCH", body }),
};
