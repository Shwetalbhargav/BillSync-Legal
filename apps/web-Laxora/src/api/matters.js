import { makeResource, request } from "./client.js";

export const mattersApi = {
  ...makeResource("/api/cases", { idKey: "caseId" }),
  updateStatus: (caseId, body) => request(`/api/cases/${caseId}/status`, { method: "PATCH", body }),
  timeEntries: (caseId, params) => request(`/api/cases/${caseId}/time-entries`, { params }),
  invoices: (caseId, params) => request(`/api/cases/${caseId}/invoices`, { params }),
  payments: (caseId, params) => request(`/api/cases/${caseId}/payments`, { params }),
  rollup: (caseId, params) => request(`/api/cases/${caseId}/rollup`, { params }),
  byClient: (clientId, params) => request(`/api/cases/by-client/${clientId}`, { params }),
};
