import { request } from "./client.js";

export const aiApi = {
  consumers: () => request("/api/ai/consumers"),
  usage: () => request("/api/ai/usage"),
  generateEmail: (body) => request("/api/ai/generate-email", { method: "POST", body }),
  assist: (body) => request("/api/ai/assist", { method: "POST", body }),
  matterDocuments: (params) => request("/api/ai/matter-documents", { params }),
  createMatterDocument: (body) => request("/api/ai/matter-documents", { method: "POST", body }),
  matterChat: (body) => request("/api/ai/matter-chat", { method: "POST", body }),
  generateDocument: (body) => request("/api/ai/generate-document", { method: "POST", body }),
  emailToBillable: (body) => request("/api/ai/email-to-billable", { method: "POST", body }),
};
