import { makeResource, request } from "./client.js";

export const rateCardsApi = {
  ...makeResource("/api/rate-cards"),
  resolve: (params) => request("/api/rate-cards/resolve", { params }),
};
