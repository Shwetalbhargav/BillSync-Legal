import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import {
  exportTimeEntriesCsv,
  exportInvoicesCsv,
  exportGstCsv,
  getGstSummary,
  exportUtilizationCsv,
  getWorkflowReports,
  exportWorkflowCsv,
  getReportCatalog,
} from '../controllers/reportsController.js';
import { REPORT_PERMISSIONS, requireReportAccess } from '../services/reportAccessService.js';

const router = Router();

router.use(authenticate);

/**
 * Examples:
 *  GET /api/reports/time-entries.csv?from=2025-09-01&to=2025-09-30&userId=<uid>
 *  GET /api/reports/invoices.csv?from=2025-09-01&to=2025-09-30&status=sent
 *  GET /api/reports/utilization.csv?from=2025-09-01&to=2025-09-30&groupBy=user
 */
router.get('/', requireReportAccess(REPORT_PERMISSIONS.view), getReportCatalog);
router.get('/workflow', requireReportAccess(REPORT_PERMISSIONS.view), getWorkflowReports);
router.get('/workflow.csv', requireReportAccess(REPORT_PERMISSIONS.export), exportWorkflowCsv);
router.get('/time-entries.csv', requireReportAccess(REPORT_PERMISSIONS.export), exportTimeEntriesCsv);
router.get('/invoices.csv', requireReportAccess(REPORT_PERMISSIONS.export), exportInvoicesCsv);
router.get('/gst-summary', requireReportAccess(REPORT_PERMISSIONS.view), getGstSummary);
router.get('/gst.csv', requireReportAccess(REPORT_PERMISSIONS.export), exportGstCsv);
router.get('/utilization.csv', requireReportAccess(REPORT_PERMISSIONS.export), exportUtilizationCsv);

export default router;
