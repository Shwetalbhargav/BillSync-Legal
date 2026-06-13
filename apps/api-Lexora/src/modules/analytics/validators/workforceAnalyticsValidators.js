import { date, objectId, string, validateQuery } from '../../../middleware/validate.js';

export const validateWorkforceAnalyticsQuery = validateQuery({
  from: [date()],
  to: [date()],
  userId: [objectId()],
  clientId: [objectId()],
  caseId: [objectId()],
  matterId: [objectId()],
  taskId: [objectId()],
  team: [string({ max: 80 })],
});
