import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import {
  validateComputeAndUpsert,
  validateGenerateSnapshots,
} from '../validators/kpiSnapshotValidators.js';
import {
  generateSnapshots,
  listSnapshots,
  getSnapshotById,
  computeAndUpsert
} from '../controllers/kpiSnapshotController.js';
import { REPORT_PERMISSIONS, requireReportAccess } from '../../reports/services/reportAccessService.js';

const router = Router();

router.use(authenticate);

/**
 * Examples:
 *  POST /api/kpi-snapshots/generate  { "month": "2025-09", "scopes": ["firm","client"], "scopeIds": ["<clientId1>","<clientId2>"] }
 *  GET  /api/kpi-snapshots?month=2025-09&scope=client&scopeId=<clientId>
 *  GET  /api/kpi-snapshots/<id>
 */
router.post('/generate', requireReportAccess(REPORT_PERMISSIONS.manage, { write: true }), validateGenerateSnapshots, generateSnapshots);
router.get('/', requireReportAccess(REPORT_PERMISSIONS.view), listSnapshots);
router.post('/compute-upsert', requireReportAccess(REPORT_PERMISSIONS.manage, { write: true }), validateComputeAndUpsert, computeAndUpsert);
router.get('/:id', requireReportAccess(REPORT_PERMISSIONS.view), getSnapshotById);

export default router;
