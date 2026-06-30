import { backendGapAdapters } from "./gaps.js";
import { activitySamplesApi } from "./activitySamples.js";
import { appUsageEventsApi } from "./appUsageEvents.js";
import { idleIntervalsApi } from "./idleIntervals.js";
import { timeEntriesApi } from "./timeEntries.js";
import { usersApi } from "./users.js";
import { workSessionsApi } from "./workSessions.js";
import { asList, normalizeIdleSummary, normalizeMoney, normalizeUser, toId } from "./normalizers.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function minutes(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeTimeEntry(item = {}) {
  const user = item.userId || item.user || {};
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  return {
    id: toId(item),
    userId: toId(user) || item.userId || "",
    userName: user.name || item.userName || "",
    matter: matter.title || matter.name || item.caseName || "",
    client: client.displayName || client.name || item.clientName || "",
    billableMinutes: minutes(item.billableMinutes),
    nonbillableMinutes: minutes(item.nonbillableMinutes),
    totalMinutes: minutes(item.billableMinutes) + minutes(item.nonbillableMinutes),
    amount: normalizeMoney(item.amount),
    status: String(item.status || "draft").toLowerCase(),
    date: item.date || item.createdAt || "",
    narrative: item.narrative || "",
    raw: item,
  };
}

function normalizeWorkSession(item = {}) {
  const user = item.userId || item.user || {};
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  return {
    id: toId(item),
    userId: toId(user) || item.userId || "",
    userName: user.name || item.userName || "",
    matter: matter.title || matter.name || item.caseName || "",
    client: client.displayName || client.name || item.clientName || "",
    status: String(item.status || "recorded").toLowerCase(),
    startedAt: item.startedAt || item.createdAt || "",
    endedAt: item.endedAt || "",
    durationMinutes: minutes(item.durationMinutes),
    activityType: item.activityType || "work",
    raw: item,
  };
}

function profileDetails(response = {}) {
  const profile = response.profile || response.data?.profile || null;
  return {
    profile,
    defaultRate: Number(response.defaultRate || response.data?.defaultRate || profile?.billingRate || 0),
  };
}

function summarizePeople(users, entries, sessions) {
  const byUser = new Map(users.map((user) => [user.id, {
    ...user,
    billableMinutes: 0,
    nonbillableMinutes: 0,
    workMinutes: 0,
    sessionCount: 0,
    amount: 0,
  }]));

  entries.forEach((entry) => {
    const row = byUser.get(entry.userId);
    if (!row) return;
    row.billableMinutes += entry.billableMinutes;
    row.nonbillableMinutes += entry.nonbillableMinutes;
    row.amount += entry.amount;
  });

  sessions.forEach((session) => {
    const row = byUser.get(session.userId);
    if (!row) return;
    row.workMinutes += session.durationMinutes;
    row.sessionCount += 1;
  });

  return Array.from(byUser.values()).map((row) => ({
    ...row,
    totalMinutes: row.billableMinutes + row.nonbillableMinutes,
    utilization: row.billableMinutes + row.nonbillableMinutes ? (row.billableMinutes / (row.billableMinutes + row.nonbillableMinutes)) * 100 : 0,
  }));
}

export const peopleWorkspaceApi = {
  async loadDashboard(params = {}) {
    const [usersResult, entriesResult, sessionsResult, attendanceResult, activityResult, appUsageResult, idleResult] = await Promise.allSettled([
      usersApi.list({ limit: 100 }),
      timeEntriesApi.list(params),
      workSessionsApi.list(params),
      backendGapAdapters.attendanceOverview.load(),
      activitySamplesApi.summary(params),
      appUsageEventsApi.summary(params),
      idleIntervalsApi.list(params),
    ]);

    const users = asList(settledValue(usersResult, [])).map(normalizeUser);
    const timeEntries = asList(settledValue(entriesResult, [])).map(normalizeTimeEntry);
    const activity = settledValue(activityResult, { sessions: [], summary: null });
    const appUsage = settledValue(appUsageResult, { sessions: [], summary: null });
    const idle = settledValue(idleResult, { intervals: [], summary: null });
    const activityBySession = new Map((activity.sessions || []).map((session) => [session.workSessionId, session]));
    const appUsageBySession = new Map((appUsage.sessions || []).map((session) => [session.workSessionId, session]));
    const workSessions = asList(settledValue(sessionsResult, [])).map((session) => {
      const normalized = normalizeWorkSession(session);
      const activitySummary = activityBySession.get(normalized.id) || null;
      const appUsageSummary = appUsageBySession.get(normalized.id) || null;
      const idleIntervals = (idle.intervals || []).filter((interval) => interval.workSessionId === normalized.id);
      const idleSummary = idleIntervals.length ? normalizeIdleSummary({ intervals: idleIntervals }) : null;
      return {
        ...normalized,
        activitySummary,
        activityPercent: activitySummary?.activityPercent || 0,
        appUsageSummary,
        idleSummary,
        idleIntervals,
      };
    });
    const people = summarizePeople(users, timeEntries, workSessions);
    const activeSessions = workSessions.filter((session) => ["running", "paused"].includes(session.status));

    return {
      people,
      users,
      timeEntries,
      workSessions,
      activeSessions,
      activitySummary: activity.summary,
      appUsageSummary: appUsage.summary,
      idleSummary: idle.summary,
      attendanceMessage: settledValue(attendanceResult, null),
      issues: [
        issueMessage(usersResult, "Team directory could not be refreshed."),
        issueMessage(entriesResult, "Workload details could not be refreshed."),
        issueMessage(sessionsResult, "Work sessions could not be refreshed."),
        issueMessage(activityResult, "Activity percentages could not be refreshed."),
        issueMessage(appUsageResult, "App and website history could not be refreshed."),
        issueMessage(idleResult, "Idle time markers could not be refreshed."),
        issueMessage(attendanceResult, "Attendance overview is not turned on yet."),
      ].filter(Boolean),
    };
  },

  async loadPerson(userId, params = {}) {
    const [dashboardResult, profileResult, entriesResult, sessionsResult] = await Promise.allSettled([
      this.loadDashboard(params),
      usersApi.profile(userId),
      timeEntriesApi.list({ ...params, userId }),
      workSessionsApi.list({ ...params, userId }),
    ]);
    const dashboard = settledValue(dashboardResult, { people: [], users: [], issues: [] });
    const user = dashboard.people.find((person) => person.id === userId) || dashboard.users.find((person) => person.id === userId) || null;
    const profile = profileDetails(settledValue(profileResult, {}));
    const timeEntries = asList(settledValue(entriesResult, [])).map(normalizeTimeEntry);
    const workSessions = asList(settledValue(sessionsResult, [])).map(normalizeWorkSession);
    const [personSummary] = summarizePeople(user ? [user] : [], timeEntries, workSessions);

    return {
      person: personSummary || user,
      profile,
      timeEntries,
      workSessions,
      issues: [
        ...(dashboard.issues || []),
        issueMessage(profileResult, "Employee profile could not be refreshed."),
        issueMessage(entriesResult, "Employee workload could not be refreshed."),
        issueMessage(sessionsResult, "Employee work sessions could not be refreshed."),
      ].filter(Boolean),
    };
  },
};
