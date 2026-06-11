import { request } from "./client.js";

export const zohoApi = {
  connect: () => request("/api/integrations/zoho/connect"),
  callback: (params) => request("/api/integrations/zoho/callback", { params }),
  status: () => request("/api/integrations/zoho/status"),
  modules: () => request("/api/integrations/zoho-sync/modules"),
  fields: (moduleApiName) => request(`/api/integrations/zoho-sync/modules/${moduleApiName}/fields`),
  syncClients: (body) => request("/api/integrations/zoho-sync/sync/clients", { method: "POST", body }),
  syncClientContacts: (clientId, body) => request(`/api/integrations/zoho-sync/sync/clients/${clientId}/contacts`, { method: "POST", body }),
  syncCases: (body) => request("/api/integrations/zoho-sync/sync/cases", { method: "POST", body }),
  syncInvoices: (body) => request("/api/integrations/zoho-sync/sync/invoices", { method: "POST", body }),
  activities: (moduleApiName, params) => request(`/api/integrations/zoho-sync/activities/${moduleApiName}`, { params }),
  createActivity: (moduleApiName, body) => request(`/api/integrations/zoho-sync/activities/${moduleApiName}`, { method: "POST", body }),
  linkWorkdrive: (body) => request("/api/integrations/zoho-sync/workdrive/link", { method: "POST", body }),
  attachments: (moduleApiName, recordId) => request(`/api/integrations/zoho-sync/${moduleApiName}/${recordId}/attachments`),
  uploadAttachment: (moduleApiName, recordId, body) =>
    request(`/api/integrations/zoho-sync/${moduleApiName}/${recordId}/attachments`, { method: "POST", body }),
  related: (moduleApiName, recordId, relatedListApiName) =>
    request(`/api/integrations/zoho-sync/${moduleApiName}/${recordId}/related/${relatedListApiName}`),
};
