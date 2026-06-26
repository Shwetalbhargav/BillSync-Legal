import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { CaseAssignmentController } from '../controllers/caseAssignmentController.js';
import {
  normalizeAssignmentPayload,
  rejectUnknownAssignmentCreateFields,
  rejectUnknownAssignmentUpdateFields,
  requireAssignmentUpdateFields,
  validateAssignmentIdParam,
  validateAssignmentQuery,
  validateCaseIdParam,
  validateCreateCaseAssignment,
  validateUpdateCaseAssignment,
} from '../validators/caseValidators.js';
import { MATTER_PERMISSIONS, requireMatterAccess } from '../services/matterAccessService.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireMatterAccess(MATTER_PERMISSIONS.assign, { write: true }),
  rejectUnknownAssignmentCreateFields,
  normalizeAssignmentPayload,
  validateCreateCaseAssignment,
  CaseAssignmentController.assign
);
router.get('/', requireMatterAccess(MATTER_PERMISSIONS.read), validateAssignmentQuery, CaseAssignmentController.list);
router.get('/timeline/:caseId', requireMatterAccess(MATTER_PERMISSIONS.read), validateCaseIdParam, CaseAssignmentController.staffingTimeline);
router.get('/:id', requireMatterAccess(MATTER_PERMISSIONS.read), validateAssignmentIdParam, CaseAssignmentController.getById);
router.put(
  '/:id',
  requireMatterAccess(MATTER_PERMISSIONS.assign, { write: true }),
  validateAssignmentIdParam,
  rejectUnknownAssignmentUpdateFields,
  normalizeAssignmentPayload,
  requireAssignmentUpdateFields,
  validateUpdateCaseAssignment,
  CaseAssignmentController.update
);
router.delete('/:id', requireMatterAccess(MATTER_PERMISSIONS.assign, { write: true }), validateAssignmentIdParam, CaseAssignmentController.remove);

export default router;
