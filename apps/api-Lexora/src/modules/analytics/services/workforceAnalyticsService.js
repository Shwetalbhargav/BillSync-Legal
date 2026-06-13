import mongoose from 'mongoose';

import { ActivitySample } from '../../activitySamples/models/ActivitySample.js';
import { AppUsageEvent } from '../../appUsageEvents/models/AppUsageEvent.js';
import { AttendanceDay } from '../../attendance/models/AttendanceDay.js';
import { IdleInterval } from '../../idleIntervals/models/IdleInterval.js';
import { TimeEntry } from '../../timeEntries/models/TimeEntry.js';
import { WorkSession } from '../../workSessions/models/WorkSession.js';

const dayMs = 24 * 60 * 60 * 1000;

const toObjectId = (value) => (
  mongoose.Types.ObjectId.isValid(String(value || '')) ? new mongoose.Types.ObjectId(value) : null
);

const idString = (value) => (value === undefined || value === null ? '' : String(value._id || value));

const dateOnly = (value) => new Date(value).toISOString().slice(0, 10);

const personName = (value) => value?.name || value?.email || 'Team member';
const clientName = (value) => value?.displayName || value?.name || 'Client not set';
const matterName = (value) => value?.title || value?.name || 'Matter not set';
const taskName = (value) => value?.title || '';

function range(query = {}) {
  const today = new Date();
  const from = query.from ? new Date(query.from) : new Date(today.getTime() - (6 * dayMs));
  const to = query.to ? new Date(query.to) : today;
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to, fromDate: dateOnly(from), toDate: dateOnly(to) };
}

function addIdFilter(match, field, queryValue) {
  if (!queryValue) return true;
  const id = toObjectId(queryValue);
  if (!id) return false;
  match[field] = id;
  return true;
}

function entityMatch(query = {}) {
  const match = {};
  if (!addIdFilter(match, 'userId', query.userId)) return false;
  if (!addIdFilter(match, 'clientId', query.clientId)) return false;
  if (!addIdFilter(match, 'caseId', query.caseId || query.matterId)) return false;
  if (!addIdFilter(match, 'taskId', query.taskId)) return false;
  return match;
}

function percent(part, total) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

function safeMinutes(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function addOption(map, id, label) {
  if (id && label && !map.has(id)) map.set(id, { id, label });
}

async function readWorkforceData(query) {
  const dates = range(query);
  const baseMatch = entityMatch(query);
  if (baseMatch === false) {
    const error = new Error('Invalid filter');
    error.statusCode = 400;
    throw error;
  }

  const sessionMatch = { ...baseMatch, startedAt: { $gte: dates.from, $lte: dates.to }, status: { $ne: 'discarded' } };
  const eventMatch = { ...baseMatch, startedAt: { $gte: dates.from, $lte: dates.to } };
  const sampleMatch = { ...baseMatch, windowStart: { $gte: dates.from, $lte: dates.to } };
  const idleMatch = { ...baseMatch, intervalStart: { $gte: dates.from, $lte: dates.to } };
  const timeEntryMatch = { ...baseMatch, date: { $gte: dates.from, $lte: dates.to } };
  const attendanceMatch = { date: { $gte: dates.fromDate, $lte: dates.toDate } };
  if (baseMatch.userId) attendanceMatch.userId = baseMatch.userId;

  const [sessions, samples, idleIntervals, appEvents, entries, attendance] = await Promise.all([
    WorkSession.find(sessionMatch)
      .populate('userId', 'name email role')
      .populate('clientId', 'displayName name')
      .populate('caseId', 'title name')
      .populate('taskId', 'title status')
      .sort({ startedAt: -1 })
      .limit(1000)
      .lean(),
    ActivitySample.find(sampleMatch).limit(5000).lean(),
    IdleInterval.find(idleMatch).limit(5000).lean(),
    AppUsageEvent.find(eventMatch).sort({ durationSeconds: -1 }).limit(5000).lean(),
    TimeEntry.find(timeEntryMatch)
      .populate('userId', 'name email role')
      .populate('clientId', 'displayName name')
      .populate('caseId', 'title name')
      .populate('taskId', 'title status')
      .sort({ date: -1 })
      .limit(1000)
      .lean(),
    AttendanceDay.find(attendanceMatch)
      .populate('userId', 'name email role')
      .sort({ date: -1 })
      .limit(2000)
      .lean(),
  ]);

  return { sessions, samples, idleIntervals, appEvents, entries, attendance, dates };
}

function summarize(data) {
  const bySession = new Map();
  const byPerson = new Map();
  const appTotals = new Map();
  const domainTotals = new Map();
  const attendanceByUserDate = new Map();
  const attendanceSummary = {};
  const options = { users: new Map(), clients: new Map(), matters: new Map(), tasks: new Map() };

  data.attendance.forEach((day) => {
    const userId = idString(day.userId);
    attendanceByUserDate.set(`${userId}:${day.date}`, day);
    attendanceSummary[day.status] = (attendanceSummary[day.status] || 0) + 1;
    addOption(options.users, userId, personName(day.userId));
  });

  data.sessions.forEach((session) => {
    const sessionId = idString(session);
    const userId = idString(session.userId);
    const minutes = safeMinutes(session.payableDurationMinutes ?? session.durationMinutes);
    bySession.set(sessionId, {
      id: sessionId,
      userId,
      userName: personName(session.userId),
      clientId: idString(session.clientId),
      clientName: clientName(session.clientId),
      matterId: idString(session.caseId),
      matterName: matterName(session.caseId),
      taskId: idString(session.taskId),
      taskName: taskName(session.taskId),
      date: dateOnly(session.startedAt),
      startedAt: session.startedAt,
      minutes,
      billable: Boolean(session.billable),
      activityType: session.activityType || 'work',
      status: session.status,
      sampleSeconds: 0,
      activeSeconds: 0,
      idleSeconds: 0,
      discardedIdleSeconds: 0,
      appSeconds: 0,
      apps: new Map(),
      domains: new Map(),
    });
    addOption(options.users, userId, personName(session.userId));
    addOption(options.clients, idString(session.clientId), clientName(session.clientId));
    addOption(options.matters, idString(session.caseId), matterName(session.caseId));
    addOption(options.tasks, idString(session.taskId), taskName(session.taskId));
  });

  data.samples.forEach((sample) => {
    const row = bySession.get(idString(sample.workSessionId));
    if (!row) return;
    row.sampleSeconds += Number(sample.sampleSeconds || 0);
    row.activeSeconds += Number(sample.activeSeconds || 0);
  });

  data.idleIntervals.forEach((idle) => {
    const row = bySession.get(idString(idle.workSessionId));
    if (!row) return;
    const seconds = Number(idle.durationSeconds || 0);
    row.idleSeconds += seconds;
    if (idle.status === 'discarded') row.discardedIdleSeconds += seconds;
  });

  data.appEvents.forEach((event) => {
    const row = bySession.get(idString(event.workSessionId));
    if (!row) return;
    const seconds = Number(event.durationSeconds || 0);
    row.appSeconds += seconds;
    row.apps.set(event.appName, (row.apps.get(event.appName) || 0) + seconds);
    if (event.domain) row.domains.set(event.domain, (row.domains.get(event.domain) || 0) + seconds);
    appTotals.set(event.appName, (appTotals.get(event.appName) || 0) + seconds);
    if (event.domain) domainTotals.set(event.domain, (domainTotals.get(event.domain) || 0) + seconds);
  });

  const entryBySessionKey = new Map();
  let billableMinutes = 0;
  let nonbillableMinutes = 0;
  let payrollReadyMinutes = 0;
  let payrollReadyAmount = 0;
  let reviewedCount = 0;
  let approvalHours = 0;
  const approvalStatus = {};

  data.entries.forEach((entry) => {
    const userId = idString(entry.userId);
    billableMinutes += safeMinutes(entry.billableMinutes);
    nonbillableMinutes += safeMinutes(entry.nonbillableMinutes);
    approvalStatus[entry.status] = (approvalStatus[entry.status] || 0) + 1;
    if (['approved', 'billed', 'paid'].includes(entry.status)) {
      payrollReadyMinutes += safeMinutes(entry.billableMinutes) + safeMinutes(entry.nonbillableMinutes);
      payrollReadyAmount += Number(entry.amount || 0);
    }
    if (entry.submittedAt && entry.reviewedAt) {
      reviewedCount += 1;
      approvalHours += (new Date(entry.reviewedAt).getTime() - new Date(entry.submittedAt).getTime()) / 3600000;
    }
    entryBySessionKey.set(`${userId}:${dateOnly(entry.date)}:${idString(entry.caseId)}:${idString(entry.taskId)}`, entry);
    addOption(options.users, userId, personName(entry.userId));
    addOption(options.clients, idString(entry.clientId), clientName(entry.clientId));
    addOption(options.matters, idString(entry.caseId), matterName(entry.caseId));
    addOption(options.tasks, idString(entry.taskId), taskName(entry.taskId));
  });

  const rows = Array.from(bySession.values()).map((row) => {
    const entry = entryBySessionKey.get(`${row.userId}:${row.date}:${row.matterId}:${row.taskId}`) || null;
    const attendance = attendanceByUserDate.get(`${row.userId}:${row.date}`) || null;
    const person = byPerson.get(row.userId) || {
      id: row.userId,
      name: row.userName,
      trackedMinutes: 0,
      activeSeconds: 0,
      sampleSeconds: 0,
      idleSeconds: 0,
      discardedIdleSeconds: 0,
      sessions: 0,
    };
    person.trackedMinutes += row.minutes;
    person.activeSeconds += row.activeSeconds;
    person.sampleSeconds += row.sampleSeconds;
    person.idleSeconds += row.idleSeconds;
    person.discardedIdleSeconds += row.discardedIdleSeconds;
    person.sessions += 1;
    byPerson.set(row.userId, person);
    return {
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      clientId: row.clientId,
      clientName: row.clientName,
      matterId: row.matterId,
      matterName: row.matterName,
      taskId: row.taskId,
      taskName: row.taskName,
      date: row.date,
      activityType: row.activityType,
      trackedMinutes: row.minutes,
      billable: row.billable,
      activityPercent: percent(row.activeSeconds, row.sampleSeconds),
      idlePercent: percent(row.idleSeconds, row.minutes * 60),
      idleSeconds: row.idleSeconds,
      discardedIdleSeconds: row.discardedIdleSeconds,
      topApp: Array.from(row.apps.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '',
      topDomain: Array.from(row.domains.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '',
      approvalStatus: entry?.status || 'not submitted',
      attendanceStatus: attendance?.status || 'not recorded',
      payrollReady: Boolean(entry && ['approved', 'billed', 'paid'].includes(entry.status)),
      billableReady: Boolean(entry && ['approved', 'billed', 'paid'].includes(entry.status) && entry.billableMinutes > 0),
    };
  });

  const trackedMinutes = rows.reduce((sum, row) => sum + row.trackedMinutes, 0);
  const sampleSeconds = rows.reduce((sum, row) => sum + Math.round((row.trackedMinutes || 0) * 60), 0);
  const activeSeconds = Array.from(bySession.values()).reduce((sum, row) => sum + row.activeSeconds, 0);
  const idleSeconds = rows.reduce((sum, row) => sum + row.idleSeconds, 0);

  return {
    summary: {
      trackedMinutes,
      billableMinutes,
      nonbillableMinutes,
      billablePercent: percent(billableMinutes, billableMinutes + nonbillableMinutes),
      activityPercent: percent(activeSeconds, rows.reduce((sum, row) => sum + (bySession.get(row.id)?.sampleSeconds || 0), 0)),
      idlePercent: percent(idleSeconds, sampleSeconds),
      utilizationPercent: percent(billableMinutes, trackedMinutes),
      payrollReadyMinutes,
      payrollReadyAmount: Math.round(payrollReadyAmount * 100) / 100,
      approvalSlaHours: reviewedCount ? Math.round((approvalHours / reviewedCount) * 10) / 10 : 0,
      approvalStatus,
      attendance: attendanceSummary,
      sessions: rows.length,
      people: byPerson.size,
    },
    people: Array.from(byPerson.values()).map((person) => ({
      ...person,
      activityPercent: percent(person.activeSeconds, person.sampleSeconds),
      idlePercent: percent(person.idleSeconds, person.trackedMinutes * 60),
    })).sort((a, b) => b.trackedMinutes - a.trackedMinutes),
    appUsage: Array.from(appTotals.entries()).map(([name, seconds]) => ({ name, seconds })).sort((a, b) => b.seconds - a.seconds).slice(0, 10),
    domainUsage: Array.from(domainTotals.entries()).map(([name, seconds]) => ({ name, seconds })).sort((a, b) => b.seconds - a.seconds).slice(0, 10),
    rows,
    filters: {
      users: Array.from(options.users.values()).sort((a, b) => a.label.localeCompare(b.label)),
      clients: Array.from(options.clients.values()).sort((a, b) => a.label.localeCompare(b.label)),
      matters: Array.from(options.matters.values()).sort((a, b) => a.label.localeCompare(b.label)),
      tasks: Array.from(options.tasks.values()).sort((a, b) => a.label.localeCompare(b.label)),
      teamEnabled: false,
    },
  };
}

export async function getWorkforceAnalytics(query = {}) {
  const data = await readWorkforceData(query);
  const report = summarize(data);
  return {
    ...report,
    range: {
      from: data.dates.fromDate,
      to: data.dates.toDate,
    },
    privacy: {
      screenshots: false,
      keystrokeValues: false,
      pageContent: false,
      note: 'Uses timer, approval, attendance, activity percentage, idle timing, and app/domain duration only.',
    },
    gaps: query.team ? ['Named team records are not connected yet; filter by person, client, matter, or task.'] : [],
  };
}
