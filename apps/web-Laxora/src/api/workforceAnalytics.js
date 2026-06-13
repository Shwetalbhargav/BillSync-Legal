import { request } from "./client.js";
import { normalizeWorkforceAnalytics } from "./normalizers.js";

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) return response.data;
  return response;
}

export const workforceAnalyticsApi = {
  async dashboard(params) {
    return normalizeWorkforceAnalytics(unwrap(await request("/api/analytics/workforce", { params })));
  },
};
