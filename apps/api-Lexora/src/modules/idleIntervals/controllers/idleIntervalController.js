import { IdleInterval } from '../models/IdleInterval.js';
import { WorkSession } from '../../workSessions/models/WorkSession.js';
import { Activity } from '../../activities/models/Activity.js';
import { TimeEntry } from '../../timeEntries/models/TimeEntry.js';
import { computeRatedAmount, resolveBillingRate } from '../../rates/services/rateResolver.js';
import { detectIdleForSession, intervalsForSession, payableMinutesAfterIdle } from '../services/idleIntervalService.js';

const idString = (value) => (value === undefined || value === null ? '' : String(value._id || value));
const isManagerRole = (role) => ['admin', 'partner'].includes(String(role || '').toLowerCase());

function canView(session, req) {
  return isManagerRole(req.user?.role) || idString(session.userId) === req.user?.id;
}

function canResolve(interval, req) {
  return isManagerRole(req.user?.role) || idString(interval.userId) === req.user?.id;
}

function parseDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  return date && !Number.isNaN(date.getTime()) ? date : fallback;
}

function summarize(intervals = [], session = null) {
  const totals = intervals.reduce(
    (summary, interval) => {
      summary.count += 1;
      summary.totalSeconds += Number(interval.durationSeconds || 0);
      if (interval.status === 'pending') summary.pendingSeconds += Number(interval.durationSeconds || 0);
      if (interval.status === 'discarded') summary.discardedSeconds += Number(interval.durationSeconds || 0);
      if (interval.status === 'kept') summary.keptSeconds += Number(interval.durationSeconds || 0);
      return summary;
    },
    { count: 0, totalSeconds: 0, pendingSeconds: 0, discardedSeconds: 0, keptSeconds: 0 }
  );
  const payableMinutes = session?.durationMinutes ? payableMinutesAfterIdle(session.durationMinutes, intervals) : undefined;
  return { ...totals, ...(payableMinutes ? { payableMinutes } : {}) };
}

async function recalculateConvertedWork(interval) {
  const session = await WorkSession.findById(interval.workSessionId);
  if (!session || !session.activityId || !session.durationMinutes) return;
  const intervals = await intervalsForSession(session._id);
  const payableMinutes = payableMinutesAfterIdle(session.durationMinutes, intervals);
  await Activity.updateOne(
    { _id: session.activityId },
    {
      $set: {
        durationMinutes: payableMinutes,
        roundedDurationMinutes: payableMinutes,
        'webMeter.idleSummary': summarize(intervals, session),
      },
      $push: {
        auditTrail: {
          action: 'idle_resolved',
          actorId: interval.decidedBy,
          at: new Date(),
          changes: { idleIntervalId: interval._id, status: interval.status, payableMinutes },
        },
      },
    }
  );

  const entry = await TimeEntry.findOne({ activityId: session.activityId });
  if (!entry) return;
  const billableMinutes = entry.billableMinutes ? payableMinutes : 0;
  const nonbillableMinutes = entry.billableMinutes ? 0 : payableMinutes;
  const resolved = await resolveBillingRate({
    userId: session.userId,
    clientId: session.clientId,
    caseId: session.caseId,
    activityCode: session.activityCode,
    at: session.endedAt || session.startedAt || new Date(),
  });
  entry.billableMinutes = billableMinutes;
  entry.nonbillableMinutes = nonbillableMinutes;
  entry.amount = computeRatedAmount({ ratePerHour: resolved.ratePerHour, billableMinutes });
  entry.idleSummary = summarize(intervals, session);
  if (typeof entry.save === 'function') await entry.save();
}

export const IdleIntervalController = {
  async detectForSession(req, res) {
    try {
      const session = await WorkSession.findById(req.params.id);
      if (!session) return res.status(404).json({ ok: false, code: 'WORK_SESSION_NOT_FOUND', message: 'Work session not found' });
      if (!canView(session, req)) return res.status(403).json({ ok: false, code: 'IDLE_INTERVAL_FORBIDDEN', message: 'Idle time is not available for your role' });
      if (!['running', 'paused', 'stopped'].includes(session.status)) {
        return res.status(409).json({ ok: false, code: 'WORK_SESSION_NOT_TRACKABLE', message: 'Idle time can only be checked for tracked sessions' });
      }
      const detected = await detectIdleForSession(session, {
        observedAt: parseDate(req.body?.observedAt || req.body?.returnedAt),
        source: req.body?.source || 'return_prompt',
      });
      const intervals = await intervalsForSession(session._id);
      res.status(detected.length ? 201 : 200).json({ ok: true, data: { detected, intervals, summary: summarize(intervals, session) } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to check idle time' });
    }
  },

  async listForSession(req, res) {
    try {
      const session = await WorkSession.findById(req.params.id);
      if (!session) return res.status(404).json({ ok: false, code: 'WORK_SESSION_NOT_FOUND', message: 'Work session not found' });
      if (!canView(session, req)) return res.status(403).json({ ok: false, code: 'IDLE_INTERVAL_FORBIDDEN', message: 'Idle time is not available for your role' });
      const intervals = await intervalsForSession(session._id);
      res.json({ ok: true, data: { workSessionId: session._id, intervals, summary: summarize(intervals, session) } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load idle time' });
    }
  },

  async list(req, res) {
    try {
      const filter = {};
      if (!isManagerRole(req.user?.role)) filter.userId = req.user?.id;
      if (req.query.userId && isManagerRole(req.user?.role)) filter.userId = req.query.userId;
      if (req.query.workSessionId) filter.workSessionId = req.query.workSessionId;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.from || req.query.to) {
        filter.intervalStart = {};
        if (req.query.from) filter.intervalStart.$gte = new Date(req.query.from);
        if (req.query.to) filter.intervalStart.$lte = new Date(req.query.to);
      }
      const intervals = await IdleInterval.find(filter).sort({ intervalStart: -1 }).limit(500);
      res.json({ ok: true, data: { intervals, summary: summarize(intervals) } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load idle time' });
    }
  },

  async resolve(req, res) {
    try {
      const interval = await IdleInterval.findById(req.params.id);
      if (!interval) return res.status(404).json({ ok: false, code: 'IDLE_INTERVAL_NOT_FOUND', message: 'Idle time not found' });
      if (!canResolve(interval, req)) return res.status(403).json({ ok: false, code: 'IDLE_INTERVAL_FORBIDDEN', message: 'Idle time is not available for your role' });

      interval.status = req.body.decision;
      interval.reason = req.body.reason;
      interval.decidedBy = req.user.id;
      interval.decidedAt = new Date();
      interval.payableImpactSeconds = interval.status === 'discarded' ? Number(interval.durationSeconds || 0) : 0;
      await interval.save();
      await recalculateConvertedWork(interval);
      res.json({ ok: true, data: interval });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to update idle time' });
    }
  },
};
