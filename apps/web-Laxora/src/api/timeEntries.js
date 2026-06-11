import { makeResource, request } from "./client.js";

export const timeEntriesApi = {
  ...makeResource("/api/time-entries"),
  fromActivity: (activityId, body) => request(`/api/time-entries/from-activity/${activityId}`, { method: "POST", body }),
  submit: (id, body) => request(`/api/time-entries/${id}/submit`, { method: "POST", body }),
  approve: (id, body) => request(`/api/time-entries/${id}/approve`, { method: "POST", body }),
  reject: (id, body) => request(`/api/time-entries/${id}/reject`, { method: "POST", body }),
};
