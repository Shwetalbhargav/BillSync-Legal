import { createUploadBody, makeResource, request } from "./client.js";

export const documentStorageApi = {
  ...makeResource("/api/document-storage"),
  upload: (files, fields) => request("/api/document-storage", { method: "POST", body: createUploadBody(files, fields) }),
};
