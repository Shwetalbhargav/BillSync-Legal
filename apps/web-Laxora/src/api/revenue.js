import { request } from "./client.js";

export const revenueApi = {
  breakdown: (params) => request("/api/revenue/breakdown", { params }),
  monthly: (params) => request("/api/revenue/monthly", { params }),
};
