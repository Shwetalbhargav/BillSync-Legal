import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import {
  normalizeCasePayload,
  rejectUnknownCaseFields,
  rejectUnknownCaseStatusFields,
  validateCaseStatus,
  validateCaseIdParam,
  validateCaseRollupQuery,
  validateCreateCase,
  validateClientIdParam,
  validateListCasesQuery,
  validateRelatedCaseQuery,
  validateUpdateCase,
  requireCaseBodyFields,
} from '../validators/caseValidators.js';
import {
  createCase,
  getAllCases,
  getCaseById,
  updateCase,
  deleteCase,
  transitionStatus,
  listCaseTimeEntries,
  listCaseInvoices,
  listCasePayments,
  caseRollup,
  getCasesByClient,
} from '../controllers/caseController.js';
import { MATTER_PERMISSIONS, requireMatterAccess } from '../services/matterAccessService.js';

const router = Router();

router.use(authenticate);

// CRUD
router.post('/', requireMatterAccess(MATTER_PERMISSIONS.create, { write: true }), rejectUnknownCaseFields, normalizeCasePayload, validateCreateCase, createCase);
router.get('/', requireMatterAccess(MATTER_PERMISSIONS.read), validateListCasesQuery, getAllCases);

// Convenience
router.get('/by-client/:clientId', requireMatterAccess(MATTER_PERMISSIONS.read), validateClientIdParam, validateListCasesQuery, getCasesByClient);

router.get('/:caseId', requireMatterAccess(MATTER_PERMISSIONS.read), validateCaseIdParam, getCaseById);
router.put(
  '/:caseId',
  requireMatterAccess(MATTER_PERMISSIONS.edit, { write: true }),
  validateCaseIdParam,
  rejectUnknownCaseFields,
  normalizeCasePayload,
  requireCaseBodyFields,
  validateUpdateCase,
  updateCase
);
router.delete('/:caseId', requireMatterAccess(MATTER_PERMISSIONS.edit, { write: true }), validateCaseIdParam, deleteCase);

// Status transition
router.patch(
  '/:caseId/status',
  requireMatterAccess(MATTER_PERMISSIONS.edit, { write: true }),
  validateCaseIdParam,
  rejectUnknownCaseStatusFields,
  normalizeCasePayload,
  validateCaseStatus,
  transitionStatus
);

// Related lists
router.get('/:caseId/time-entries', requireMatterAccess(MATTER_PERMISSIONS.read), validateCaseIdParam, validateRelatedCaseQuery, listCaseTimeEntries);
router.get('/:caseId/invoices', requireMatterAccess(MATTER_PERMISSIONS.read), validateCaseIdParam, listCaseInvoices);
router.get('/:caseId/payments', requireMatterAccess(MATTER_PERMISSIONS.read), validateCaseIdParam, listCasePayments);

// Rollup (WIP/Billed/AR)
router.get('/:caseId/rollup', requireMatterAccess(MATTER_PERMISSIONS.read), validateCaseIdParam, validateCaseRollupQuery, caseRollup);

export default router;
