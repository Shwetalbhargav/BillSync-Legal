import { AppUsageEvent } from '../models/AppUsageEvent.js';
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
  'html',
  'body',
  'selection',
  'clipboard',
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

function cleanString(value, fallback = '') {
  return String(value || fallback).trim();
}

function normalizeDomain({ url, domain }) {
  const explicit = cleanString(domain).toLowerCase();
  if (explicit) return explicit.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  const rawUrl = cleanString(url);
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl.includes('://') ? rawUrl : `https://${rawUrl}`);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function sanitizeUrl(value) {
  const text = cleanString(value);
  if (!text) return '';
  try {
    const parsed = new URL(text.includes('://') ? text : `https://${text}`);
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function canViewSession(session, req) {
  return isManagerRole(req.user?.role) || idString(session.userId) === req.user?.id;
}

function canIngestForSession(session, req) {
  return idString(session.userId) === req.user?.id;
}

function buildTimelineSummary(events = []) {
  const summary = events.reduce(
    (totals, event) => {
      totals.eventCount += 1;
      totals.durationSeconds += Number(event.durationSeconds || 0);
      return totals;
    },
    { eventCount: 0, durationSeconds: 0 }
  );

  const byApp = new Map();
  const byDomain = new Map();
  for (const event of events) {
    const seconds = Number(event.durationSeconds || 0);
    const appName = event.appName || 'Unknown app';
    byApp.set(appName, (byApp.get(appName) || 0) + seconds);
    if (event.domain) byDomain.set(event.domain, (byDomain.get(event.domain) || 0) + seconds);
  }

  const toRows = ([name, durationSeconds]) => ({ name, durationSeconds });
  return {
    ...summary,
    apps: [...byApp.entries()].map(toRows).sort((a, b) => b.durationSeconds - a.durationSeconds),
    domains: [...byDomain.entries()].map(toRows).sort((a, b) => b.durationSeconds - a.durationSeconds),
  };
}

function buildEventPayload(session, req) {
  const forbiddenField = hasForbiddenField(req.body || {});
  if (forbiddenField) {
    const error = new Error('App and website records can only include names, addresses, and timing.');
    error.statusCode = 400;
    error.code = 'APP_USAGE_PRIVACY_FIELD_FORBIDDEN';
    error.field = forbiddenField;
    throw error;
  }

  const startedAt = parseDate(req.body.startedAt);
  const endedAt = parseDate(req.body.endedAt);
  if (!startedAt || !endedAt || endedAt <= startedAt) {
    const error = new Error('App usage timing is not valid');
    error.statusCode = 400;
    error.code = 'APP_USAGE_INVALID_WINDOW';
    throw error;
  }

  const durationSeconds = Number(req.body.durationSeconds || Math.round((endedAt - startedAt) / 1000));
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 86400) {
    const error = new Error('App usage duration is not valid');
    error.statusCode = 400;
    error.code = 'APP_USAGE_INVALID_DURATION';
    throw error;
  }

  const url = sanitizeUrl(req.body.url);
  const domain = normalizeDomain({ url: req.body.url, domain: req.body.domain });

  return {
    workSessionId: session._id,
    userId: session.userId,
    clientId: session.clientId,
    caseId: session.caseId,
    taskId: session.taskId || undefined,
    appName: cleanString(req.body.appName, 'Unknown app'),
    url,
    domain,
    title: cleanString(req.body.title).slice(0, 180),
    startedAt,
    endedAt,
    durationSeconds,
    platform: req.body.platform || 'unknown',
    sourceApp: req.body.sourceApp || 'unknown',
    privacyPolicy: 'app_url_duration_only_no_content',
  };
}

export const AppUsageEventController = {
  async createForSession(req, res) {
    try {
      const session = await WorkSession.findById(req.params.id);
      if (!session) return res.status(404).json({ ok: false, code: 'WORK_SESSION_NOT_FOUND', message: 'Work session not found' });
      if (!canIngestForSession(session, req)) {
        return res.status(403).json({ ok: false, code: 'APP_USAGE_FORBIDDEN', message: 'You can only add app activity for your own active session' });
      }
      if (!['running', 'paused'].includes(session.status)) {
        return res.status(409).json({ ok: false, code: 'WORK_SESSION_NOT_ACTIVE', message: 'App activity can only be added to an active session' });
      }

      const event = await AppUsageEvent.create(buildEventPayload(session, req));
      session.webMeter = {
        ...(session.webMeter?.toObject?.() || session.webMeter || {}),
        privacyNote: 'Tracks app names, website domains, timing, and activity counts only. No screenshots, keystroke values, page text, or document text are stored.',
        lastActiveAt: event.endedAt,
      };
      session.lastHeartbeatAt = event.endedAt;
      await session.save();

      res.status(201).json({ ok: true, data: event });
    } catch (err) {
      res.status(err.statusCode || 500).json({
        ok: false,
        code: err.code || 'APP_USAGE_CREATE_FAILED',
        message: err.statusCode ? err.message : 'Failed to record app activity',
        ...(err.field ? { field: err.field } : {}),
      });
    }
  },

  async sessionTimeline(req, res) {
    try {
      const session = await WorkSession.findById(req.params.id);
      if (!session) return res.status(404).json({ ok: false, code: 'WORK_SESSION_NOT_FOUND', message: 'Work session not found' });
      if (!canViewSession(session, req)) {
        return res.status(403).json({ ok: false, code: 'APP_USAGE_FORBIDDEN', message: 'This app history is not available for your role' });
      }
      const events = await AppUsageEvent.find({ workSessionId: session._id }).sort({ startedAt: 1 }).limit(500);
      res.json({ ok: true, data: { workSessionId: session._id, summary: buildTimelineSummary(events), events } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load app history' });
    }
  },

  async listSummary(req, res) {
    try {
      if (!isManagerRole(req.user?.role)) {
        return res.status(403).json({ ok: false, code: 'APP_USAGE_FORBIDDEN', message: 'App history is available to firm reviewers' });
      }
      const filter = {};
      if (req.query.userId) filter.userId = req.query.userId;
      if (req.query.workSessionId) filter.workSessionId = req.query.workSessionId;
      if (req.query.from || req.query.to) {
        filter.startedAt = {};
        if (req.query.from) filter.startedAt.$gte = new Date(req.query.from);
        if (req.query.to) filter.startedAt.$lte = new Date(req.query.to);
      }
      const events = await AppUsageEvent.find(filter).sort({ startedAt: -1 }).limit(1000);
      const bySession = new Map();
      for (const event of events) {
        const key = idString(event.workSessionId);
        const bucket = bySession.get(key) || [];
        bucket.push(event);
        bySession.set(key, bucket);
      }
      const sessions = [...bySession.entries()].map(([workSessionId, rows]) => ({
        workSessionId,
        summary: buildTimelineSummary(rows),
        events: rows,
      }));
      res.json({ ok: true, data: { summary: buildTimelineSummary(events), sessions } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load app history summaries' });
    }
  },
};
