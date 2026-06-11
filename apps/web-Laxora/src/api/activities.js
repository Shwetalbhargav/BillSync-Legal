import { makeResource, request } from "./client.js";

export const activitiesApi = {
  ...makeResource("/api/activities"),
};

export function createActivityFromCapture(body) {
  return request("/api/activities", { method: "POST", body });
}
