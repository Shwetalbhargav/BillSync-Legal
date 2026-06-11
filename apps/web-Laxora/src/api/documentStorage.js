import { makeResource, request } from "./client.js";

export const documentStorageApi = {
  ...makeResource("/api/document-storage"),
  createRecord: (body) => request("/api/document-storage", { method: "POST", body }),
  setStatus: (documentId, body) => request(`/api/document-storage/${documentId}/status`, { method: "POST", body }),
  upload: (fields) => request("/api/document-storage", { method: "POST", body: fields }),
};
