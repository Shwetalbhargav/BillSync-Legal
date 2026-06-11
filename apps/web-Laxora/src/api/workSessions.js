import { makeResource, request } from "./client.js";

export const workSessionsApi = {
  ...makeResource("/api/work-sessions"),
  start: (body) => request("/api/work-sessions/start", { method: "POST", body }),
  current: () => request("/api/work-sessions/current"),
  heartbeat: (id, body) => request(`/api/work-sessions/${id}/heartbeat`, { method: "POST", body }),
  pause: (id, body) => request(`/api/work-sessions/${id}/pause`, { method: "POST", body }),
  resume: (id) => request(`/api/work-sessions/${id}/resume`, { method: "POST" }),
  stop: (id, body) => request(`/api/work-sessions/${id}/stop`, { method: "POST", body }),
  discard: (id, body) => request(`/api/work-sessions/${id}/discard`, { method: "POST", body }),
};
