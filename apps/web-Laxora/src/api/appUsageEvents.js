import { request } from "./client.js";
import { asList, normalizeAppUsageTimeline } from "./normalizers.js";

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) return response.data;
  return response;
}

export const appUsageEventsApi = {
  createForSession: (workSessionId, body) => request(`/api/app-usage-events/work-sessions/${workSessionId}/events`, { method: "POST", body }),
  sessionTimeline: async (workSessionId) => normalizeAppUsageTimeline(unwrap(await request(`/api/app-usage-events/work-sessions/${workSessionId}/timeline`))),
  summary: async (params) => {
    const data = unwrap(await request("/api/app-usage-events/summary", { params }));
    return {
      summary: normalizeAppUsageTimeline(data),
      sessions: asList(data.sessions).map((item) => ({
        workSessionId: item.workSessionId || "",
        ...normalizeAppUsageTimeline(item),
      })),
    };
  },
};
