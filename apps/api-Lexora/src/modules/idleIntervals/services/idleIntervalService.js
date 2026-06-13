import { IdleInterval } from '../models/IdleInterval.js';
import { ActivitySample } from '../../activitySamples/models/ActivitySample.js';

const idString = (value) => (value === undefined || value === null ? '' : String(value._id || value));

export function idleThresholdSeconds(session) {
  return Number(session?.webMeter?.idleAfterSeconds || 300);
}

export function discardedIdleSeconds(intervals = []) {
  return intervals
    .filter((interval) => interval.status === 'discarded')
    .reduce((sum, interval) => sum + Number(interval.durationSeconds || 0), 0);
}

export function payableMinutesAfterIdle(totalMinutes, intervals = []) {
  const totalSeconds = Math.max(60, Number(totalMinutes || 0) * 60);
  const payableSeconds = Math.max(60, totalSeconds - discardedIdleSeconds(intervals));
  return Math.max(1, Math.round(payableSeconds / 60));
}

export async function createOrUpdateIdleInterval({ session, intervalStart, intervalEnd, detectionSource, status = 'pending' }) {
  const start = intervalStart instanceof Date ? intervalStart : new Date(intervalStart);
  const end = intervalEnd instanceof Date ? intervalEnd : new Date(intervalEnd);
  const thresholdSeconds = idleThresholdSeconds(session);
  const durationSeconds = Math.round((end - start) / 1000);
  if (!Number.isFinite(durationSeconds) || durationSeconds < thresholdSeconds) return null;

  return IdleInterval.findOneAndUpdate(
    { workSessionId: session._id, intervalStart: start, intervalEnd: end },
    {
      $setOnInsert: {
        workSessionId: session._id,
        userId: session.userId,
        clientId: session.clientId,
        caseId: session.caseId,
        taskId: session.taskId || undefined,
        intervalStart: start,
        intervalEnd: end,
        durationSeconds,
        thresholdSeconds,
        detectionSource,
        status,
        payableImpactSeconds: status === 'discarded' ? durationSeconds : 0,
        privacyPolicy: 'idle_timing_only_no_content',
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

export async function detectIdleForSession(session, { observedAt = new Date(), source = 'return_prompt' } = {}) {
  const now = observedAt instanceof Date ? observedAt : new Date(observedAt);
  const thresholdSeconds = idleThresholdSeconds(session);
  const detected = [];
  const lastActiveAt = session.webMeter?.lastActiveAt ? new Date(session.webMeter.lastActiveAt) : null;
  const lastHeartbeatAt = session.lastHeartbeatAt ? new Date(session.lastHeartbeatAt) : null;
  const anchor = lastActiveAt || lastHeartbeatAt || null;

  if (anchor && !Number.isNaN(anchor.getTime()) && now > anchor) {
    const gapSeconds = Math.round((now - anchor) / 1000);
    if (gapSeconds >= thresholdSeconds) {
      const interval = await createOrUpdateIdleInterval({
        session,
        intervalStart: anchor,
        intervalEnd: now,
        detectionSource: source === 'manual_review' ? 'manual_review' : 'return_prompt',
      });
      if (interval) detected.push(interval);
    }
  }

  const samples = await ActivitySample.find({ workSessionId: session._id }).sort({ windowStart: -1 }).limit(100);
  for (const sample of samples) {
    const inactiveSeconds = Number(sample.inactiveSeconds || 0);
    if (inactiveSeconds < thresholdSeconds) continue;
    const end = new Date(sample.windowEnd);
    const start = new Date(end.getTime() - inactiveSeconds * 1000);
    const interval = await createOrUpdateIdleInterval({
      session,
      intervalStart: start,
      intervalEnd: end,
      detectionSource: 'activity_sample',
    });
    if (interval && !detected.some((item) => idString(item._id) === idString(interval._id))) detected.push(interval);
  }

  return detected;
}

export async function intervalsForSession(workSessionId) {
  return IdleInterval.find({ workSessionId }).sort({ intervalStart: 1 });
}
