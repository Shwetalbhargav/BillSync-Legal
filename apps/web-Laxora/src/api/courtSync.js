import { calendarApi } from "./calendar.js";
import { backendGapAdapters } from "./gaps.js";
import { mattersApi } from "./matters.js";
import { asList, normalizeMatter } from "./normalizers.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

const setupSteps = [
  "Choose court feed source",
  "Confirm firm matters to watch",
  "Review matches before linking",
  "Turn on daily refresh",
];

function buildReadiness(feedResult, matchResult, verdictResult) {
  return [
    {
      id: "daily-feed",
      label: "Daily court feed",
      status: feedResult.status === "fulfilled" ? "Connected" : "Needs setup",
      detail: feedResult.status === "fulfilled" ? "Daily updates are available." : "Cause lists, orders, and verdicts will appear after setup.",
    },
    {
      id: "matter-match",
      label: "Matter matching",
      status: matchResult.status === "fulfilled" ? "Connected" : "Needs setup",
      detail: matchResult.status === "fulfilled" ? "Court items can be linked to matters." : "Incoming court items will wait for review before linking.",
    },
    {
      id: "verdict-feed",
      label: "Verdict details",
      status: verdictResult.status === "fulfilled" ? "Connected" : "Needs setup",
      detail: verdictResult.status === "fulfilled" ? "Verdict details are available." : "Order and verdict detail pages are waiting on feed setup.",
    },
  ];
}

export const courtSyncApi = {
  async loadWorkspace(params = {}) {
    const [hearingsResult, mattersResult, feedResult, matchResult, verdictResult] = await Promise.allSettled([
      calendarApi.loadHearings(params),
      mattersApi.list({ limit: 100 }),
      backendGapAdapters.courtDailyFeed.load(),
      backendGapAdapters.courtCaseMatch.load(),
      backendGapAdapters.courtVerdicts.load(),
    ]);

    const hearings = settledValue(hearingsResult, { hearings: [], sessions: [], timeEntries: [] });
    const matters = asList(settledValue(mattersResult, [])).map(normalizeMatter);

    return {
      hearings: hearings.hearings || [],
      hearingTimeEntries: hearings.timeEntries || [],
      matters,
      courtItems: [],
      matches: [],
      verdicts: [],
      setupSteps,
      readiness: buildReadiness(feedResult, matchResult, verdictResult),
      issues: [
        issueMessage(hearingsResult, "Manual hearing records could not be refreshed."),
        issueMessage(mattersResult, "Matter list could not be refreshed."),
        issueMessage(feedResult, "Daily court sync is not connected yet."),
        issueMessage(matchResult, "Court case matching is not connected yet."),
        issueMessage(verdictResult, "Verdict details are not connected yet."),
      ].filter(Boolean),
    };
  },

  async runDailySync() {
    return backendGapAdapters.courtDailyFeed.run();
  },

  async linkCourtMatch(matchId, body) {
    return backendGapAdapters.courtCaseMatch.update(matchId, body);
  },
};
