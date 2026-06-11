import { activitiesApi } from "./activities.js";
import { backendGapAdapters } from "./gaps.js";
import { asList, normalizeActivity, normalizeWorkSession } from "./normalizers.js";
import { workSessionsApi } from "./workSessions.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function relatedMeetingActivity(item) {
  const activity = normalizeActivity(item);
  return {
    ...activity,
    kind: activity.type === "call" ? "Call" : "Meeting",
  };
}

function relatedWorkSession(item) {
  const session = normalizeWorkSession(item);
  return {
    ...session,
    kind: session.activityType === "call" ? "Call" : "Meeting",
  };
}

export const recorderGaps = {
  recordingLibrary: {
    routeNeeded: "GET /api/recordings",
    note: "Recording library persistence is planned. Current screens do not create saved recordings.",
  },
  recordingCreate: backendGapAdapters.recorderTranscription,
  recordingDetail: {
    routeNeeded: "GET /api/recordings/:recordingId",
    note: "Saved recording detail, transcript, and processing status are planned.",
  },
  transcriptCreate: {
    routeNeeded: "POST /api/recordings/:recordingId/transcribe",
    note: "Transcript generation is planned for saved meeting recordings.",
  },
  matterLink: {
    routeNeeded: "PATCH /api/recordings/:recordingId/matter",
    note: "Matter linking for saved recordings is planned.",
  },
};

export const recordingsApi = {
  async loadWorkspace() {
    const [meetingActivitiesResult, callActivitiesResult, sessionsResult] = await Promise.allSettled([
      activitiesApi.list({ activityType: "meeting", limit: 50 }),
      activitiesApi.list({ activityType: "call", limit: 50 }),
      workSessionsApi.list({ limit: 50 }),
    ]);

    const activities = [
      ...asList(settledValue(meetingActivitiesResult, [])),
      ...asList(settledValue(callActivitiesResult, [])),
    ].map(relatedMeetingActivity);

    const sessions = asList(settledValue(sessionsResult, []))
      .map(relatedWorkSession)
      .filter((session) => ["meeting", "call"].includes(session.activityType));

    return {
      recordings: [],
      activities,
      sessions,
      issues: [
        issueMessage(meetingActivitiesResult, "Meeting activity could not be refreshed."),
        issueMessage(callActivitiesResult, "Call activity could not be refreshed."),
        issueMessage(sessionsResult, "Meeting work sessions could not be refreshed."),
      ].filter(Boolean),
      gaps: recorderGaps,
    };
  },

  async getRecording() {
    return {
      recording: null,
      transcript: null,
      gaps: recorderGaps,
    };
  },

  async createRecording() {
    return backendGapAdapters.recorderTranscription.create();
  },
};
