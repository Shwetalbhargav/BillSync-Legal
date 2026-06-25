import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { requireLegalMutation } from '../../../middleware/commercialPermissions.js';
import {
  validateActivityIdParam,
  validateCreateTimeEntry,
  validateUpdateTimeEntry,
} from '../validators/timeEntryValidators.js';
import {
  createTimeEntry,
  createFromActivity,
  listTimeEntries,
  updateTimeEntry,
  submitTimeEntry,
  approveTimeEntry,
  rejectTimeEntry,
} from '../controllers/timeEntryController.js';

const router = Router();

router.use(authenticate);

router.post('/', requireLegalMutation, validateCreateTimeEntry, createTimeEntry);
router.post('/from-activity/:activityId', requireLegalMutation, validateActivityIdParam, createFromActivity);
router.get('/', listTimeEntries);
router.patch('/:id', requireLegalMutation, validateUpdateTimeEntry, updateTimeEntry);
router.post('/:id/submit', requireLegalMutation, submitTimeEntry);
router.post('/:id/approve', requireLegalMutation, approveTimeEntry);
router.post('/:id/reject', requireLegalMutation, rejectTimeEntry);

export default router;
