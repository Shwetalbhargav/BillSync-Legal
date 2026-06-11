import { request } from "./client.js";

export const aiApi = {
  generateEmail: (body) => request("/api/ai/generate-email", { method: "POST", body }),
  emailToBillable: (body) => request("/api/ai/email-to-billable", { method: "POST", body }),
};
