import { makeResource, request } from "./client.js";

export const activitiesApi = {
  ...makeResource("/api/activities"),
  review: (activityId) => request(`/api/activities/${activityId}/review`, { method: "POST" }),
  ignore: (activityId, body) => request(`/api/activities/${activityId}/ignore`, { method: "POST", body }),
  lock: (activityId, body) => request(`/api/activities/${activityId}/lock`, { method: "POST", body }),
  void: (activityId, body) => request(`/api/activities/${activityId}/void`, { method: "POST", body }),
};

export function createActivityFromCapture(body) {
  return request("/api/activities", { method: "POST", body });
}
