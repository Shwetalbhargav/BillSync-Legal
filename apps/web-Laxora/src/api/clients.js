import { makeResource, request } from "./client.js";
import { backendGapAdapters } from "./gaps.js";

export const clientsApi = {
  ...makeResource("/api/clients", { idKey: "clientId" }),
  assignOwner: (clientId, body) => request(`/api/clients/${clientId}/assign-owner`, { method: "PATCH", body }),
  cases: (clientId, params) => request(`/api/clients/${clientId}/cases`, { params }),
  invoices: (clientId, params) => request(`/api/clients/${clientId}/invoices`, { params }),
  payments: (clientId, params) => request(`/api/clients/${clientId}/payments`, { params }),
  summary: (clientId) => request(`/api/clients/${clientId}/summary`),
  contacts: {
    load: (client) => Promise.resolve(client?.contacts || []),
    update: backendGapAdapters.clientContacts.load,
  },
};
