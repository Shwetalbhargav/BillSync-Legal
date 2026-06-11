import { request } from "./client.js";

export const zohoStorageApi = {
  modules: () => request("/api/integrations/zoho-sync/modules"),
  linkWorkDrive: (body) => request("/api/integrations/zoho-sync/workdrive/link", { method: "POST", body }),
  attachments: (moduleApiName, recordId) => request(`/api/integrations/zoho-sync/${moduleApiName}/${recordId}/attachments`),
  uploadAttachment: (moduleApiName, recordId, body) => request(`/api/integrations/zoho-sync/${moduleApiName}/${recordId}/attachments`, { method: "POST", body }),
};
