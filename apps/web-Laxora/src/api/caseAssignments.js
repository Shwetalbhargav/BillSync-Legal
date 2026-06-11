import { makeResource, request } from "./client.js";

export const caseAssignmentsApi = {
  ...makeResource("/api/case-assignments"),
  timeline: (caseId, params) => request(`/api/case-assignments/timeline/${caseId}`, { params }),
};
