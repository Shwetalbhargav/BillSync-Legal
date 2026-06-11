import { activitiesApi, createActivityFromCapture } from "./activities.js";
import { backendGapAdapters } from "./gaps.js";
import { timeEntriesApi } from "./timeEntries.js";
import { workSessionsApi } from "./workSessions.js";
import { asList, normalizeActivity, normalizeTimeEntry, normalizeWorkSession } from "./normalizers.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

export const calendarApi = {
  provider: backendGapAdapters.calendarProvider,

  async loadHearings(params = {}) {
    const [activitiesResult, sessionsResult, timeResult] = await Promise.allSettled([
      activitiesApi.list({ activityType: "hearing", limit: 50, sort: "-startedAt", ...params }),
      workSessionsApi.list({ activityType: "hearing", ...params }),
      timeEntriesApi.list(params),
    ]);

    const hearings = asList(settledValue(activitiesResult, [])).map(normalizeHearingActivity);
    const sessions = asList(settledValue(sessionsResult, [])).map(normalizeWorkSession).filter((session) => session.activityType === "hearing");
    const hearingTime = asList(settledValue(timeResult, [])).map(normalizeTimeEntry).filter((entry) => String(entry.title).toLowerCase().includes("hearing"));

    return {
      hearings,
      sessions,
      timeEntries: hearingTime,
      issues: [
        issueMessage(activitiesResult, "Hearings could not be refreshed."),
        issueMessage(sessionsResult, "Meter sessions could not be refreshed."),
        issueMessage(timeResult, "Time entries could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async saveManualHearing({ activity, timeEntry }) {
    const savedActivity = await createActivityFromCapture(activity);
    const savedTimeEntry = timeEntry ? await timeEntriesApi.create(timeEntry) : null;
    return { activity: savedActivity, timeEntry: savedTimeEntry };
  },
};

export function normalizeHearingActivity(item = {}) {
  const activity = normalizeActivity(item);
  const event = item.calendarEvent || {};
  return {
    ...activity,
    title: event.title || activity.title,
    courtName: event.courtName || "",
    courtroom: event.courtroom || "",
    judgeOrBench: event.judgeOrBench || "",
    location: event.location || "",
    scheduledStart: event.scheduledStart || item.startedAt || activity.occurredAt,
    scheduledEnd: event.scheduledEnd || item.endedAt || "",
    notes: event.notes || item.narrative || "",
  };
}
