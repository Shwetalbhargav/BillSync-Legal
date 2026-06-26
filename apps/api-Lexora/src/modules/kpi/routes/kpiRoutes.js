import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { getKpiSummary, getKpiTrend } from '../controllers/kpiController.js';
import { REPORT_PERMISSIONS, requireReportAccess } from '../../reports/services/reportAccessService.js';

const router = Router();

router.use(authenticate);

/**
 * Examples:
 *  GET /api/kpi/summary?scope=firm&month=2025-09
 *  GET /api/kpi/summary?scope=client&scopeId=<clientId>&from=2025-01-01&to=2025-03-31
 *  GET /api/kpi/trend?metric=revenue&months=6&scope=user&scopeId=<userId>
 */
router.get('/summary', requireReportAccess(REPORT_PERMISSIONS.view), getKpiSummary);
router.get('/trend', requireReportAccess(REPORT_PERMISSIONS.view), getKpiTrend);

export default router;
