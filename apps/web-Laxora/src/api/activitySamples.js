import { request } from "./client.js";
import { asList, normalizeActivitySummary } from "./normalizers.js";

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) return response.data;
  return response;
}

export const activitySamplesApi = {
  createForSession: (workSessionId, body) => request(`/api/activity-samples/work-sessions/${workSessionId}/samples`, { method: "POST", body }),
  sessionSummary: async (workSessionId) => normalizeActivitySummary(unwrap(await request(`/api/activity-samples/work-sessions/${workSessionId}/summary`))),
  summary: async (params) => {
    const data = unwrap(await request("/api/activity-samples/summary", { params }));
    return {
      summary: normalizeActivitySummary(data),
      sessions: asList(data.sessions).map((item) => ({
        workSessionId: item.workSessionId || "",
        ...normalizeActivitySummary(item),
      })),
    };
  },
};
