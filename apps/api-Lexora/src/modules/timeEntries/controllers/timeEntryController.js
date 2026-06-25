// src/controllers/timeEntryController.js
import mongoose from 'mongoose';
import { TimeEntry } from '../models/TimeEntry.js';
import { Activity } from '../../activities/models/Activity.js';
import { ActivitySample } from '../../activitySamples/models/ActivitySample.js';
import { AppUsageEvent } from '../../appUsageEvents/models/AppUsageEvent.js';
import Billable from '../../billables/models/Billable.js';
import { WorkSession } from '../../workSessions/models/WorkSession.js';
import { computeRatedAmount, resolveBillingRate } from '../../rates/services/rateResolver.js';

const withSession = (query, session) =>
  session && query && typeof query.session === 'function' ? query.session(session) : query;

const idString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value._id || value);
};

const buildAuditEntry = ({ action, actorId, changes }) => ({
  action,
  actorId,
  at: new Date(),
  ...(changes ? { changes } : {}),
});

const isReviewerRole = (role) => ['admin', 'partner'].includes(String(role || '').toLowerCase());

const BILLABLE_CATEGORY_BY_CODE = {
  EMAIL: 'Email drafting/review',
  CALL: 'Client consultation (calls/meetings)',
  MEETING: 'Client consultation (calls/meetings)',
  DOC_REVIEW: 'Case preparation/documentation',
  RESEARCH: 'Legal research',
  NEGOTIATION: 'Negotiation/settlement discussions',
  ADMIN: 'Miscellaneous administrative legal work',
  OTHER: 'Miscellaneous administrative legal work',
};

const BILLABLE_CODE_BY_ACTIVITY_TYPE = {
  email: 'EMAIL',
  drafting: 'DOC_REVIEW',
  review: 'DOC_REVIEW',
  meeting: 'MEETING',
  hearing: 'MEETING',
  research: 'RESEARCH',
  call: 'CALL',
  other: 'OTHER',
};

const normalizeBillableActivityCode = ({ activityCode, activityType } = {}) => {
  const rawCode = String(activityCode || '').trim().toUpperCase();
  if (BILLABLE_CATEGORY_BY_CODE[rawCode]) return rawCode;
  return BILLABLE_CODE_BY_ACTIVITY_TYPE[String(activityType || '').toLowerCase()] || 'OTHER';
};

const buildActivitySummary = (samples = []) => {
  const summary = samples.reduce(
    (total, sample) => ({
      sampleCount: total.sampleCount + 1,
      sampleSeconds: total.sampleSeconds + Number(sample.sampleSeconds || 0),
      activeSeconds: total.activeSeconds + Number(sample.activeSeconds || 0),
      inactiveSeconds: total.inactiveSeconds + Number(sample.inactiveSeconds || 0),
      keyboardCount: total.keyboardCount + Number(sample.keyboardCount || 0),
      mouseCount: total.mouseCount + Number(sample.mouseCount || 0),
    }),
    { sampleCount: 0, sampleSeconds: 0, activeSeconds: 0, inactiveSeconds: 0, keyboardCount: 0, mouseCount: 0 }
  );
  summary.activityPercent = summary.sampleSeconds
    ? Math.round((summary.activeSeconds / summary.sampleSeconds) * 100)
    : 0;
  return summary;
};

const buildAppUsageSummary = (events = []) => {
  const summary = events.reduce(
    (total, event) => ({
      eventCount: total.eventCount + 1,
      durationSeconds: total.durationSeconds + Number(event.durationSeconds || 0),
    }),
    { eventCount: 0, durationSeconds: 0 }
  );
  const apps = new Map();
  for (const event of events) {
    const seconds = Number(event.durationSeconds || 0);
    const appName = event.appName || 'Unknown app';
    apps.set(appName, (apps.get(appName) || 0) + seconds);
  }
  const appRows = [...apps.entries()]
    .map(([name, durationSeconds]) => ({ name, durationSeconds }))
    .sort((a, b) => b.durationSeconds - a.durationSeconds);
  return {
    ...summary,
    apps: appRows,
    topApp: appRows[0]?.name || '',
    topAppSeconds: appRows[0]?.durationSeconds || 0,
  };
};

const enrichTimeEntriesForReview = async (rows) => {
  const plainRows = rows.map((row) => (row?.toObject ? row.toObject() : row));
  const activityIds = plainRows.map((row) => idString(row.activityId)).filter(Boolean);
  if (!activityIds.length) return plainRows;

  const sessions = await WorkSession.find({ activityId: { $in: activityIds } })
    .select('_id activityId payableDurationMinutes idleSummary')
    .lean();
  const sessionsByActivity = new Map(sessions.map((session) => [idString(session.activityId), session]));
  const sessionIds = sessions.map((session) => session._id);

  const samples = sessionIds.length
    ? await ActivitySample.find({ workSessionId: { $in: sessionIds } }).lean()
    : [];
  const appEvents = sessionIds.length
    ? await AppUsageEvent.find({ workSessionId: { $in: sessionIds } }).lean()
    : [];
  const samplesBySession = samples.reduce((groups, sample) => {
    const key = idString(sample.workSessionId);
    groups.set(key, [...(groups.get(key) || []), sample]);
    return groups;
  }, new Map());
  const appEventsBySession = appEvents.reduce((groups, event) => {
    const key = idString(event.workSessionId);
    groups.set(key, [...(groups.get(key) || []), event]);
    return groups;
  }, new Map());

  return plainRows.map((row) => {
    const activityId = idString(row.activityId);
    const session = sessionsByActivity.get(activityId);
    const activitySummary = session ? buildActivitySummary(samplesBySession.get(idString(session._id)) || []) : buildActivitySummary();
    const appUsageSummary = session ? buildAppUsageSummary(appEventsBySession.get(idString(session._id)) || []) : buildAppUsageSummary();
    const activity = row.activityId && typeof row.activityId === 'object' ? row.activityId : {};
    return {
      ...row,
      workSessionId: session?._id,
      activitySummary,
      appUsageSummary,
      idleSummary: activity.idleSummary || activity.webMeter?.idleSummary || session?.idleSummary || row.idleSummary,
      payableDurationMinutes: session?.payableDurationMinutes,
    };
  });
};

const canOwnTimeEntry = (entry, req) =>
  req.user?.role === 'admin' || idString(entry?.userId) === req.user?.id;

const assertOwnTimeEntry = (entry, req, res) => {
  if (canOwnTimeEntry(entry, req)) return true;
  res.status(403).json({ error: 'You can only change your own time entries' });
  return false;
};

const assertRequestedTimeUser = (requestedUserId, req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  if (req.user?.role === 'admin') return true;
  if (String(requestedUserId) === req.user.id) return true;
  res.status(403).json({ error: 'Only admins can create time for another user' });
  return false;
};

const validateSubmittableEntry = (entry) => {
  if (!String(entry?.narrative || '').trim()) {
    return 'Narrative is required before submit';
  }
  const totalMinutes = Number(entry?.billableMinutes || 0) + Number(entry?.nonbillableMinutes || 0);
  if (totalMinutes <= 0) {
    return 'Time entry must have billable or nonbillable minutes';
  }
  if (Number(entry?.billableMinutes || 0) > 0 && !Number(entry?.rateApplied || 0)) {
    return 'No hourly rate is available. Add a manual rate or create a matching rate card before submit';
  }
  return null;
};

/**
 * POST /api/time-entries
 * Body: { caseId, clientId, userId, activityId?, activityCode?, narrative, billableMinutes, nonbillableMinutes, date? }
 * Auto-resolves rateApplied (if not provided) via RateCard and computes amount.
 */
export const createTimeEntry = async (req, res) => {
  try {
    const {
      caseId, clientId, userId,
      activityId, activityCode, narrative, taskId,
      billableMinutes = 0, nonbillableMinutes = 0,
      rateApplied, amount, date
    } = req.body;

    if (!caseId || !clientId || !userId || !narrative) {
      return res.status(400).json({ error: 'caseId, clientId, userId, narrative are required' });
    }
    if (!assertRequestedTimeUser(userId, req, res)) return;

    let finalActivityCode = activityCode;
    if (!finalActivityCode && activityId) {
      const act = await Activity.findById(activityId);
      finalActivityCode = act?.activityCode || null;
    }

    let finalRate = rateApplied;
    if (finalRate == null) {
      const resolved = await resolveBillingRate({
        userId,
        clientId,
        caseId,
        activityCode: finalActivityCode,
        at: date,
      });
      finalRate = resolved.ratePerHour;
    }

    const entry = await TimeEntry.create({
      caseId, clientId, userId,
      activityId: activityId || undefined,
      taskId: taskId || undefined,
      activityCode: finalActivityCode || undefined,
      narrative,
      billableMinutes,
      nonbillableMinutes,
      rateApplied: finalRate == null ? undefined : Number(finalRate),
      amount: computeRatedAmount({ amount, ratePerHour: finalRate, billableMinutes }),
      date: date ? new Date(date) : new Date(),
      status: 'draft',
    });

    res.status(201).json(entry);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
};

/**
 * POST /api/time-entries/from-activity/:activityId
 * Creates a TimeEntry from an Activity (uses activity.durationMinutes as billableMinutes if present).
 */
export const createFromActivity = async (req, res) => {
  let session;
  try {
    const { activityId } = req.params;
    session = await mongoose.startSession();
    let entry;

    await session.withTransaction(async () => {
      const act = await withSession(Activity.findById(activityId), session);
      if (!act) {
        const error = new Error('Activity not found');
        error.statusCode = 404;
        throw error;
      }

      if (req.user?.role !== 'admin' && idString(act.userId) !== req.user?.id) {
        const error = new Error('You can only convert your own activities');
        error.statusCode = 403;
        throw error;
      }

      if (act.conversionStatus === 'converted' || act.convertedTimeEntryId) {
        const error = new Error('Activity has already been converted to a time entry');
        error.statusCode = 409;
        throw error;
      }

      if (['ignored', 'locked', 'voided'].includes(act.status)) {
        const error = new Error(`Activity cannot be converted while ${act.status}`);
        error.statusCode = 409;
        throw error;
      }

      const existing = await withSession(TimeEntry.findOne({ activityId: act._id }), session);
      if (existing) {
        const error = new Error('Activity has already been converted to a time entry');
        error.statusCode = 409;
        throw error;
      }

      const resolvedRate = await resolveBillingRate({
        userId: act.userId,
        clientId: act.clientId,
        caseId: act.caseId,
        activityCode: act.activityCode,
        at: act.endedAt || act.startedAt || new Date(),
        session,
      });
      const rate = resolvedRate.ratePerHour;

      const activityMinutes = act.roundedDurationMinutes ?? act.durationMinutes ?? 0;
      const billableMinutes = act.billable === false ? 0 : activityMinutes;
      const nonbillableMinutes = act.billable === false ? activityMinutes : 0;
      const [created] = await TimeEntry.create([{
        caseId: act.caseId,
        clientId: act.clientId,
        userId: act.userId,
        activityId: act._id,
        taskId: act.taskId || undefined,
        activityCode: act.activityCode,
        narrative: act.narrative || act.activityType,
        billableMinutes,
        nonbillableMinutes,
        idleSummary: act.idleSummary || undefined,
        rateApplied: rate == null ? undefined : Number(rate),
        amount: computeRatedAmount({ ratePerHour: rate, billableMinutes }),
        date: act.endedAt || act.startedAt || new Date(),
        status: 'draft',
      }], { session });

      entry = created;

      await Activity.updateOne(
        { _id: act._id },
        {
          $set: {
            conversionStatus: 'converted',
            status: 'converted',
            convertedTimeEntryId: entry._id,
            convertedAt: new Date(),
            updatedBy: req.user.id,
          },
          $push: {
            auditTrail: buildAuditEntry({
              action: 'converted',
              actorId: req.user.id,
              changes: {
                convertedTimeEntryId: entry._id,
                status: { from: act.status, to: 'converted' },
              },
            }),
          },
        },
        { session }
      );
    });

    res.status(201).json(entry);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: 'Activity has already been converted to a time entry' });
    }

    console.error(e);
    res.status(e.statusCode || 500).json({ error: e.statusCode ? e.message : 'Failed to create entry from activity' });
  } finally {
    if (session) await session.endSession();
  }
};

/**
 * GET /api/time-entries
 * Filters: userId, clientId, caseId, status, from, to, q (narrative search)
 */
export const listTimeEntries = async (req, res) => {
  try {
    const { userId, clientId, caseId, status, from, to, q } = req.query;
    const filter = {};
    if (req.user?.role === 'admin' || req.user?.role === 'partner') {
      if (userId) filter.userId = userId;
    } else {
      if (userId && userId !== req.user?.id) {
        return res.status(403).json({ error: 'You can only list your own time entries' });
      }
      filter.userId = req.user?.id;
    }
    if (clientId) filter.clientId = clientId;
    if (caseId) filter.caseId = caseId;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    if (q) filter.narrative = { $regex: q, $options: 'i' };

    const rows = await TimeEntry.find(filter)
      .populate('userId', 'name email role')
      .populate('clientId', 'displayName name')
      .populate('caseId', 'title name')
      .populate('taskId', 'title status')
      .populate('activityId', 'activityType workTool idleSummary webMeter durationMinutes roundedDurationMinutes')
      .sort({ date: -1, createdAt: -1 });
    res.json(await enrichTimeEntriesForReview(rows));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list time entries' });
  }
};

/**
 * PATCH /api/time-entries/:id
 * Only editable in statuses: draft, submitted
 */
export const updateTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await TimeEntry.findById(id);
    if (!entry) return res.status(404).json({ error: 'Time entry not found' });
    if (!assertOwnTimeEntry(entry, req, res)) return;
    if (!['draft', 'submitted', 'rejected'].includes(entry.status)) {
      return res.status(400).json({ error: 'Entry cannot be edited in its current status' });
    }

    const patch = { ...req.body };
    const touchesFrozenRate = patch.rateApplied != null || patch.amount != null;
    if (touchesFrozenRate && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change a frozen billing rate or amount' });
    }
    if (entry.status === 'rejected') {
      patch.status = 'draft';
      patch.rejectionReason = undefined;
      patch.reviewedAt = undefined;
      patch.reviewedBy = undefined;
    }
    // If billableMinutes, rateApplied, or amount change, recompute amount unless explicitly provided
    if ((patch.billableMinutes != null || patch.rateApplied != null) && patch.amount == null) {
      const rate = patch.rateApplied != null ? patch.rateApplied : entry.rateApplied;
      const minutes = patch.billableMinutes != null ? patch.billableMinutes : entry.billableMinutes;
      patch.amount = computeRatedAmount({ ratePerHour: rate, billableMinutes: minutes });
    }

    const updated = await TimeEntry.findByIdAndUpdate(id, patch, { new: true });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
};

/**
 * Workflow transitions
 */
async function transition(id, fromStatuses, toStatus, req, { reason } = {}) {
  const entry = await TimeEntry.findById(id);
  if (!entry) return { error: 'Time entry not found' };
  if (!fromStatuses.includes(entry.status)) return { error: `Entry must be in ${fromStatuses.join('/')} to ${toStatus}` };
  if (toStatus === 'submitted') {
    if (!canOwnTimeEntry(entry, req)) {
      return { error: 'You can only change your own time entries', statusCode: 403 };
    }
    const validationError = validateSubmittableEntry(entry);
    if (validationError) return { error: validationError, statusCode: 400 };
    entry.submittedAt = new Date();
    entry.submittedBy = req.user.id;
  }
  if (['approved', 'rejected'].includes(toStatus)) {
    if (!isReviewerRole(req.user?.role)) {
      return { error: 'Only reviewers can approve or reject time entries', statusCode: 403 };
    }
    if (String(req.user?.role || '').toLowerCase() !== 'admin' && idString(entry.userId) === req.user?.id) {
      return { error: 'Reviewers cannot approve or reject their own time entries', statusCode: 403 };
    }
    entry.reviewedAt = new Date();
    entry.reviewedBy = req.user.id;
  }
  if (toStatus === 'approved') {
    entry.rejectionReason = undefined;
  }
  if (toStatus === 'rejected') {
    const trimmedReason = String(reason || '').trim();
    if (!trimmedReason) return { error: 'Rejection reason is required', statusCode: 400 };
    if (trimmedReason.length > 500) return { error: 'Rejection reason must be at most 500 characters', statusCode: 400 };
    entry.rejectionReason = trimmedReason;
  }
  entry.status = toStatus;
  await entry.save();
  return { entry };
}

async function ensureApprovedBillableForTimeEntry(entry, req) {
  const billableMinutes = Number(entry?.billableMinutes || 0);
  if (billableMinutes <= 0) return null;

  if (entry.activityId) {
    const existing = await Billable.findOne({ activityId: entry.activityId });
    if (existing) return existing;
  }

  const activity = entry.activityId ? await Activity.findById(entry.activityId) : null;
  const activityCode = normalizeBillableActivityCode({
    activityCode: entry.activityCode || activity?.activityCode,
    activityType: activity?.activityType,
  });
  const rate = Number(entry.rateApplied || 0);
  const amount = entry.amount != null
    ? Number(entry.amount)
    : computeRatedAmount({ ratePerHour: rate, billableMinutes });

  return Billable.create({
    caseId: entry.caseId,
    clientId: entry.clientId,
    userId: entry.userId,
    activityId: entry.activityId || undefined,
    subject: activity?.activityType ? `Meter: ${activity.activityType}` : 'Meter work entry',
    description: entry.narrative,
    durationMinutes: billableMinutes,
    rate,
    amount,
    date: entry.date || entry.reviewedAt || new Date(),
    activityCode,
    category: BILLABLE_CATEGORY_BY_CODE[activityCode],
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: req.user.id,
  });
}

const responseWithPipeline = (entry, billable) => ({
  ...(entry?.toObject ? entry.toObject() : entry),
  ...(billable ? { billable } : {}),
});

// POST /api/time-entries/:id/submit
export const submitTimeEntry = async (req, res) => {
  try {
    const result = await transition(req.params.id, ['draft'], 'submitted', req);
    if (result.error) return res.status(result.statusCode || 400).json({ error: result.error });
    res.json(result.entry);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to submit time entry' });
  }
};

// POST /api/time-entries/:id/approve
export const approveTimeEntry = async (req, res) => {
  try {
    const result = await transition(req.params.id, ['submitted'], 'approved', req);
    if (result.error) return res.status(result.statusCode || 400).json({ error: result.error });
    const billable = await ensureApprovedBillableForTimeEntry(result.entry, req);
    res.json(responseWithPipeline(result.entry, billable));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to approve time entry' });
  }
};

// POST /api/time-entries/:id/reject
export const rejectTimeEntry = async (req, res) => {
  try {
    const result = await transition(req.params.id, ['submitted'], 'rejected', req, {
      reason: req.body?.reason,
    });
    if (result.error) return res.status(result.statusCode || 400).json({ error: result.error });
    res.json(result.entry);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject time entry' });
  }
};
