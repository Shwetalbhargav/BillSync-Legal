import { makeResource, request } from "./client.js";

export const rateCardsApi = {
  ...makeResource("/api/rate-cards"),
  active: (params) => request("/api/rate-cards", { params: { ...params, activeOn: params?.activeOn || new Date().toISOString().slice(0, 10) } }),
  resolve: (params) => request("/api/rate-cards/resolve", { params }),
};
