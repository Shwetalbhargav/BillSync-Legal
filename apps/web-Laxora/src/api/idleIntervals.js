import { request } from "./client.js";
import { asList, normalizeIdleSummary } from "./normalizers.js";

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) return response.data;
  return response;
}

export const idleIntervalsApi = {
  detectForSession: async (workSessionId, body = {}) => normalizeIdleSummary(unwrap(await request(`/api/idle-intervals/work-sessions/${workSessionId}/detect`, { method: "POST", body }))),
  listForSession: async (workSessionId) => normalizeIdleSummary(unwrap(await request(`/api/idle-intervals/work-sessions/${workSessionId}`))),
  resolve: (id, body) => request(`/api/idle-intervals/${id}/resolve`, { method: "POST", body }),
  list: async (params) => {
    const data = unwrap(await request("/api/idle-intervals", { params }));
    return {
      ...normalizeIdleSummary(data),
      intervals: asList(data.intervals).map((item) => normalizeIdleSummary({ intervals: [item] }).intervals[0]),
    };
  },
};
