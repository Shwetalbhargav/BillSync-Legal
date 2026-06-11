import { makeResource, request } from "./client.js";

export const tasksApi = {
  ...makeResource("/api/tasks", { idKey: "taskId" }),
  updateStatus: (taskId, status) => request(`/api/tasks/${taskId}`, { method: "PATCH", body: { status } }),
  today: ({ assignedTo, dueFrom, dueTo } = {}) => request("/api/tasks", { params: { assignedTo, dueFrom, dueTo } }),
};
