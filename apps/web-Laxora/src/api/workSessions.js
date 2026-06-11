import { makeResource } from "./client.js";

export const workSessionsApi = {
  ...makeResource("/api/work-sessions"),
};
