import { makeResource } from "./client.js";

export const integrationLogsApi = {
  ...makeResource("/api/integration-logs"),
};
