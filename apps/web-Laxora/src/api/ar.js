import { request } from "./client.js";

export const arApi = {
  aging: (params) => request("/api/ar/aging", { params }),
  agingByClient: (params) => request("/api/ar/aging/by-client", { params }),
};
