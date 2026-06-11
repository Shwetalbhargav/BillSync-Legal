import { makeResource, request } from "./client.js";

export const emailEntriesApi = {
  ...makeResource("/api/email-entries"),
  map: (id, body) => request(`/api/email-entries/${id}/map`, { method: "POST", body }),
  generateNarrative: (id, body) => request(`/api/email-entries/${id}/gpt-narrative`, { method: "POST", body }),
  createActivity: (id, body) => request(`/api/email-entries/${id}/activity`, { method: "POST", body }),
  createTimeEntry: (id, body) => request(`/api/email-entries/${id}/time-entry`, { method: "POST", body }),
  syncZoho: (id, body) => request(`/api/email-entries/${id}/sync-zoho`, { method: "POST", body }),
  bulk: (body) => request("/api/email-entries/bulk", { method: "POST", body }),
};
