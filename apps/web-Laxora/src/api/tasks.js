import { makeResource } from "./client.js";

export const tasksApi = {
  ...makeResource("/api/tasks", { idKey: "taskId" }),
};
