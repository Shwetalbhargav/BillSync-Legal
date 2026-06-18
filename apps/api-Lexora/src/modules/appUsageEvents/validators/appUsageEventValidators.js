import { date, number, objectId, oneOf, required, string, validateBody, validateParams, validateQuery } from '../../../middleware/validate.js';

const platforms = ['desktop_windows', 'desktop_macos', 'desktop_linux', 'mobile_ios', 'mobile_android', 'web', 'unknown'];
const sourceApps = ['desktop_agent', 'mobile_agent', 'web_meter', 'manual_agent', 'chrome_extension', 'unknown'];

export const validateWorkSessionId = validateParams({
  id: [required, objectId()],
});

export const validateAppUsageEvent = validateBody({
  appName: [required, string({ min: 1, max: 120 })],
  url: [string({ max: 2048 })],
  domain: [string({ max: 255 })],
  title: [string({ max: 180 })],
  startedAt: [required, date()],
  endedAt: [required, date()],
  durationSeconds: [number({ min: 1, max: 86400 })],
  platform: [oneOf(platforms)],
  sourceApp: [oneOf(sourceApps)],
});

export const validateAppUsageSummaryQuery = validateQuery({
  userId: [objectId()],
  workSessionId: [objectId()],
  from: [date()],
  to: [date()],
});
