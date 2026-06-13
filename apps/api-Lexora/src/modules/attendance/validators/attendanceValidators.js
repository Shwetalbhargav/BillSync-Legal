import { date, objectId, oneOf, required, string, validateBody, validateParams, validateQuery } from '../../../middleware/validate.js';

export const validateAttendanceQuery = validateQuery({
  from: [date()],
  to: [date()],
  userId: [objectId()],
});

export const validateLeaveRequest = validateBody({
  startDate: [required, date()],
  endDate: [required, date()],
  leaveType: [oneOf(['vacation', 'sick', 'personal', 'court_duty', 'unpaid', 'other'])],
  reason: [string({ max: 500 })],
});

export const validateLeaveReview = validateBody({
  decision: [required, oneOf(['approved', 'rejected'])],
  reviewNote: [string({ max: 500 })],
});

export const validateHoliday = validateBody({
  date: [required, date()],
  name: [required, string({ min: 2, max: 160 })],
  region: [string({ max: 80 })],
});

export const validateId = validateParams({
  id: [required, objectId()],
});
