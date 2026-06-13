import { ActivitySample } from '../models/ActivitySample.js';
import { WorkSession } from '../../workSessions/models/WorkSession.js';

const FORBIDDEN_FIELDS = [
  'key',
  'keys',
  'keyValue',
  'keyValues',
  'typedText',
  'text',
  'content',
  'pageContent',
  'documentText',
  'password',
  'token',
  'screenshot',
  'image',
  'url',
  'title',
];

const isManagerRole = (role) => ['admin', 'partner'].includes(String(role || '').toLowerCase());
const idString = (value) => (value === undefined || value === null ? '' : String(value._id || value));

function hasForbiddenField(value, path = '') {
  if (!value || typeof value !== 'object') return null;
  for (const [key, child] of Object.entries(value)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_FIELDS.includes(key)) return currentPath;
    if (child && typeof child === 'object') {
      const nested = hasForbiddenField(child, currentPath);
      if (nested) return nested;
    }
  }
  return null;
}

function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function clampNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function canViewSession(session, req) {
  return isManagerRole(req.user?.role) || idString(session.userId) === req.user?.id;
}

function canIngestForSession(session, req) {
  return idString(session.userId) === req.user?.id;
}

function summarizeSamples(samples = []) {
  const totals = samples.reduce(
    (summary, sample) => {
      summary.sampleSeconds += Number(sample.sampleSeconds || 0);
      summary.activeSeconds += Number(sample.activeSeconds || 0);
      summary.inactiveSeconds += Number(sample.inactiveSeconds || 0);
      summary.keyboardCount += Number(sample.keyboardCount || 0);
      summary.mouseCount += Number(sample.mouseCount || 0);
      summary.sampleCount += 1;
      return summary;
    },
    { sampleCount: 0, sampleSeconds: 0, activeSeconds: 0, inactiveSeconds: 0, keyboardCount: 0, mouseCount: 0 }
  );
  const activityPercent = totals.sampleSeconds
    ? Math.round((totals.activeSeconds / totals.sampleSeconds) * 10000) / 100
    : 0;
  return { ...totals, activityPercent };
}

function buildSamplePayload(session, req) {
  const forbiddenField = hasForbiddenField(req.body || {});
  if (forbiddenField) {
    const error = new Error('Activity samples can only include counts and timing.');
    error.statusCode = 400;
    error.code = 'ACTIVITY_SAMPLE_PRIVACY_FIELD_FORBIDDEN';
    error.field = forbiddenField;
    throw error;
  }

  const windowStart = parseDate(req.body.windowStart);
  const windowEnd = parseDate(req.body.windowEnd);
  if (!windowStart || !windowEnd || windowEnd <= windowStart) {
    const error = new Error('Activity sample window is not valid');
    error.statusCode = 400;
    error.code = 'ACTIVITY_SAMPLE_INVALID_WINDOW';
    throw error;
  }
  const sampleSeconds = clampNumber(req.body.sampleSeconds, Math.round((windowEnd - windowStart) / 1000));
  const activeSeconds = clampNumber(req.body.activeSeconds, 0);
  const inactiveSeconds = req.body.inactiveSeconds == null
    ? Math.max(sampleSeconds - activeSeconds, 0)
    : clampNumber(req.body.inactiveSeconds, 0);

  if (sampleSeconds <= 0 || sampleSeconds > 3600 || activeSeconds > sampleSeconds || inactiveSeconds > sampleSeconds) {
    const error = new Error('Activity sample timing is not valid');
    error.statusCode = 400;
    error.code = 'ACTIVITY_SAMPLE_INVALID_TIMING';
    throw error;
  }

  return {
    workSessionId: session._id,
    userId: session.userId,
    clientId: session.clientId,
    caseId: session.caseId,
    taskId: session.taskId || undefined,
    windowStart,
    windowEnd,
    sampleSeconds,
    activeSeconds,
    inactiveSeconds,
    keyboardCount: clampNumber(req.body.keyboardCount, 0),
    mouseCount: clampNumber(req.body.mouseCount, 0),
    sourceDevice: req.body.sourceDevice || 'web',
    sourceApp: req.body.sourceApp || 'web_meter',
    activityPercent: Math.round((activeSeconds / sampleSeconds) * 10000) / 100,
    privacyPolicy: 'counts_only_no_key_values_no_content',
  };
}

export const ActivitySampleController = {
  async createForSession(req, res) {
    try {
      const session = await WorkSession.findById(req.params.id);
      if (!session) return res.status(404).json({ ok: false, code: 'WORK_SESSION_NOT_FOUND', message: 'Work session not found' });
      if (!canIngestForSession(session, req)) {
        return res.status(403).json({ ok: false, code: 'ACTIVITY_SAMPLE_FORBIDDEN', message: 'You can only add activity for your own active session' });
      }
      if (!['running', 'paused'].includes(session.status)) {
        return res.status(409).json({ ok: false, code: 'WORK_SESSION_NOT_ACTIVE', message: 'Activity can only be added to an active session' });
      }

      const payload = buildSamplePayload(session, req);
      const sample = await ActivitySample.findOneAndUpdate(
        { workSessionId: session._id, windowStart: payload.windowStart },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );

      session.webMeter = {
        ...(session.webMeter?.toObject?.() || session.webMeter || {}),
        privacyNote: 'Tracks keyboard and mouse counts only. No keystroke values, screenshots, URLs, titles, or page content are stored.',
        lastActiveAt: payload.activeSeconds > 0 ? payload.windowEnd : session.webMeter?.lastActiveAt,
        inactiveSeconds: payload.inactiveSeconds,
      };
      session.lastHeartbeatAt = payload.windowEnd;
      await session.save();

      res.status(201).json({ ok: true, data: sample });
    } catch (err) {
      res.status(err.statusCode || 500).json({
        ok: false,
        code: err.code || 'ACTIVITY_SAMPLE_CREATE_FAILED',
        message: err.statusCode ? err.message : 'Failed to record activity sample',
        ...(err.field ? { field: err.field } : {}),
      });
    }
  },

  async sessionSummary(req, res) {
    try {
      const session = await WorkSession.findById(req.params.id);
      if (!session) return res.status(404).json({ ok: false, code: 'WORK_SESSION_NOT_FOUND', message: 'Work session not found' });
      if (!canViewSession(session, req)) {
        return res.status(403).json({ ok: false, code: 'ACTIVITY_SUMMARY_FORBIDDEN', message: 'This activity summary is not available for your role' });
      }
      const samples = await ActivitySample.find({ workSessionId: session._id }).sort({ windowStart: 1 });
      res.json({ ok: true, data: { workSessionId: session._id, summary: summarizeSamples(samples), samples } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load activity summary' });
    }
  },

  async listSummary(req, res) {
    try {
      if (!isManagerRole(req.user?.role)) {
        return res.status(403).json({ ok: false, code: 'ACTIVITY_SUMMARY_FORBIDDEN', message: 'Activity summaries are available to firm reviewers' });
      }
      const filter = {};
      if (req.query.userId) filter.userId = req.query.userId;
      if (req.query.workSessionId) filter.workSessionId = req.query.workSessionId;
      if (req.query.from || req.query.to) {
        filter.windowStart = {};
        if (req.query.from) filter.windowStart.$gte = new Date(req.query.from);
        if (req.query.to) filter.windowStart.$lte = new Date(req.query.to);
      }
      const samples = await ActivitySample.find(filter).sort({ windowStart: -1 }).limit(1000);
      const bySession = new Map();
      for (const sample of samples) {
        const key = idString(sample.workSessionId);
        const bucket = bySession.get(key) || [];
        bucket.push(sample);
        bySession.set(key, bucket);
      }
      const sessions = [...bySession.entries()].map(([workSessionId, rows]) => ({
        workSessionId,
        summary: summarizeSamples(rows),
        samples: rows,
      }));
      const summary = summarizeSamples(samples);
      res.json({ ok: true, data: { summary, sessions } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load activity summaries' });
    }
  },
};
