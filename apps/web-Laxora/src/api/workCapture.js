import { activitiesApi } from "./activities.js";
import { clientsApi } from "./clients.js";
import { mattersApi } from "./matters.js";
import { tasksApi } from "./tasks.js";
import { timeEntriesApi } from "./timeEntries.js";
import { workSessionsApi } from "./workSessions.js";
import { asList, normalizeActivity, normalizeClient, normalizeMatter, normalizeTask, normalizeTimeEntry, normalizeWorkSession } from "./normalizers.js";

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) return response.data;
  return response;
}

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

export const workCaptureApi = {
  async loadMeterOptions() {
    const [currentResult, mattersResult, clientsResult, tasksResult] = await Promise.allSettled([
      workSessionsApi.current(),
      mattersApi.list({ limit: 200 }),
      clientsApi.list({ limit: 200 }),
      tasksApi.list({ limit: 200 }),
    ]);
    return {
      current: unwrap(settledValue(currentResult, null)) ? normalizeWorkSession(unwrap(settledValue(currentResult, null))) : null,
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      clients: asList(settledValue(clientsResult, [])).map(normalizeClient),
      tasks: asList(settledValue(tasksResult, [])).map(normalizeTask),
      issues: [
        issueMessage(currentResult, "Current work could not be refreshed."),
        issueMessage(mattersResult, "Matters could not be refreshed."),
        issueMessage(clientsResult, "Clients could not be refreshed."),
        issueMessage(tasksResult, "Tasks could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadHistory() {
    const [sessionsResult, timeResult] = await Promise.allSettled([
      workSessionsApi.list(),
      timeEntriesApi.list({ limit: 100 }),
    ]);
    return {
      sessions: asList(settledValue(sessionsResult, [])).map(normalizeWorkSession),
      timeEntries: asList(settledValue(timeResult, [])).map(normalizeTimeEntry),
      issues: [
        issueMessage(sessionsResult, "Work sessions could not be refreshed."),
        issueMessage(timeResult, "Time entries could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadCapturedWork() {
    const response = await activitiesApi.list({ limit: 100, sort: "-createdAt" });
    return asList(response).map(normalizeActivity);
  },

  async loadApprovalQueue() {
    const response = await timeEntriesApi.list({ status: "draft" });
    return asList(response).map(normalizeTimeEntry);
  },
};
