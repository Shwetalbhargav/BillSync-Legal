import { date, number, objectId, oneOf, required, validateBody, validateParams, validateQuery } from '../../../middleware/validate.js';

const sourceDevices = ['web', 'desktop', 'mobile', 'chrome_extension', 'unknown'];
const sourceApps = ['web_meter', 'desktop_agent', 'mobile_agent', 'manual_agent', 'chrome_extension', 'unknown'];

export const validateWorkSessionId = validateParams({
  id: [required, objectId()],
});

export const validateActivitySample = validateBody({
  windowStart: [required, date()],
  windowEnd: [required, date()],
  sampleSeconds: [number({ min: 1, max: 3600 })],
  activeSeconds: [required, number({ min: 0, max: 3600 })],
  inactiveSeconds: [number({ min: 0, max: 3600 })],
  keyboardCount: [number({ min: 0, max: 100000 })],
  mouseCount: [number({ min: 0, max: 100000 })],
  sourceDevice: [oneOf(sourceDevices)],
  sourceApp: [oneOf(sourceApps)],
});

export const validateActivitySummaryQuery = validateQuery({
  userId: [objectId()],
  workSessionId: [objectId()],
  from: [date()],
  to: [date()],
});
