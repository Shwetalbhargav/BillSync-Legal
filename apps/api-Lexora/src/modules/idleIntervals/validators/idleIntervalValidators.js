import { date, objectId, oneOf, required, string, validateBody, validateParams, validateQuery } from '../../../middleware/validate.js';

export const validateWorkSessionId = validateParams({
  id: [required, objectId()],
});

export const validateIdleIntervalId = validateParams({
  id: [required, objectId()],
});

export const validateDetectIdleInterval = validateBody({
  observedAt: [date()],
  returnedAt: [date()],
  source: [oneOf(['return_prompt', 'manual_review'])],
});

export const validateResolveIdleInterval = validateBody({
  decision: [required, oneOf(['kept', 'discarded'])],
  reason: [string({ max: 500 })],
});

export const validateIdleIntervalQuery = validateQuery({
  userId: [objectId()],
  workSessionId: [objectId()],
  status: [oneOf(['pending', 'kept', 'discarded'])],
  from: [date()],
  to: [date()],
});
