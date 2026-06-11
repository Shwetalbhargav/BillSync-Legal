import { makeResource, request } from "./client.js";

export const integrationLogsApi = {
  ...makeResource("/api/integration-logs"),
  byBillable: (billableId) => request(`/api/integration-logs/by-billable/${billableId}`),
};
